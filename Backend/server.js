const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();

app.use(express.json());
app.use(cors());

const JWT_SECRET = 'super_secret_change_me';

// MIDDLEWARE

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET); // { client_id, username, is_admin }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function adminMiddleware(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ message: 'Admin access only' });
  }
  next();
}

// TEST ROUTE

app.get('/', (req, res) => {
  res.send('API is running on port 3001');
});

// REGISTER

app.post('/api/register', async (req, res) => {
  try {
    const {
      username,
      password,
      first_name,
      last_name,
      address,
      phone,
      email,
      credit_card_info
    } = req.body;

    if (!username || !password || !first_name || !last_name || !address || !email) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    db.query(
      'SELECT client_id FROM Client WHERE username = ?',
      [username],
      async (err, results) => {
        if (err) {
          console.error('DB error on username check:', err);
          return res.status(500).json({ message: 'Server error' });
        }

        if (results.length > 0) {
          return res.status(400).json({ message: 'Username already taken' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const registrationDate = new Date();

        db.query(
          `INSERT INTO Client
           (first_name, last_name, username, address, phone, email,
            password, credit_card_info, registration_date, is_admin)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            first_name,
            last_name,
            username,
            address,
            phone || null,
            email,
            hashedPassword,
            credit_card_info || null,
            registrationDate
          ],
          (err2) => {
            if (err2) {
              console.error('DB error on insert:', err2);
              return res.status(500).json({ message: 'Server error' });
            }

            return res.status(201).json({ message: 'Client registered successfully' });
          }
        );
      }
    );
  } catch (e) {
    console.error('Register error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// LOGIN

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }

  db.query(
    'SELECT * FROM Client WHERE username = ?',
    [username],
    async (err, results) => {
      if (err) {
        console.error('DB error on login:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (results.length === 0) {
        return res.status(400).json({ message: 'Invalid username or password' });
      }

      const user = results[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(400).json({ message: 'Invalid username or password' });
      }

      const token = jwt.sign(
        {
          client_id: user.client_id,
          username: user.username,
          is_admin: !!user.is_admin
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      return res.json({
        message: 'Login successful',
        token,
        client: {
          client_id: user.client_id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          is_admin: !!user.is_admin
        }
      });
    }
  );
});

// CLIENT: CREATE SERVICE REQUEST

app.post('/api/requests', authMiddleware, (req, res) => {
  const clientId = req.user.client_id;
  const {
    service_address,
    cleaning_type,
    number_of_rooms,
    preferred_datetime,
    proposed_budget,
    notes
  } = req.body;

  if (
    !service_address ||
    !cleaning_type ||
    !number_of_rooms ||
    !preferred_datetime ||
    !proposed_budget
  ) {
    return res.status(400).json({ message: 'Missing required request fields' });
  }

  const preferredDate = new Date(preferred_datetime);
  const status = 'pending';

  db.query(
    `INSERT INTO ServiceRequest
     (client_id, service_address, cleaning_type, number_of_rooms,
      preferred_datetime, proposed_budget, notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      clientId,
      service_address,
      cleaning_type,
      number_of_rooms,
      preferredDate,
      proposed_budget,
      notes || null,
      status
    ],
    (err, result) => {
      if (err) {
        console.error('DB error on create request:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      return res.status(201).json({
        message: 'Service request created',
        request_id: result.insertId
      });
    }
  );
});

// CLIENT: LIST MY REQUESTS

app.get('/api/my/requests', authMiddleware, (req, res) => {
  const clientId = req.user.client_id;

  db.query(
    'SELECT * FROM ServiceRequest WHERE client_id = ? ORDER BY preferred_datetime DESC',
    [clientId],
    (err, results) => {
      if (err) {
        console.error('DB error on list requests:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      return res.json(results);
    }
  );
});

// CLIENT: LIST MY QUOTES

app.get('/api/my/quotes', authMiddleware, (req, res) => {
  const clientId = req.user.client_id;

  db.query(
    `SELECT q.*, r.client_id, r.request_id
     FROM Quote q
     JOIN ServiceRequest r ON q.request_id = r.request_id
     WHERE r.client_id = ?
     ORDER BY q.created_at DESC`,
    [clientId],
    (err, results) => {
      if (err) {
        console.error('DB error on list quotes:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      return res.json(results);
    }
  );
});

// CLIENT: ACCEPT QUOTE (create Order)

app.post('/api/quotes/:id/accept', authMiddleware, (req, res) => {
  const quoteId = req.params.id;
  const clientId = req.user.client_id;

  db.query(
    `SELECT q.*, r.client_id, r.request_id, r.preferred_datetime
     FROM Quote q
     JOIN ServiceRequest r ON q.request_id = r.request_id
     WHERE q.quote_id = ?`,
    [quoteId],
    (err, results) => {
      if (err) {
        console.error('DB error on accept quote select:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Quote not found' });
      }

      const quote = results[0];

      if (quote.client_id !== clientId) {
        return res.status(403).json({ message: 'Not your quote' });
      }

      if (quote.status === 'accepted') {
        return res.status(400).json({ message: 'Quote already accepted' });
      }

      const now = new Date();

      db.query(
        'UPDATE Quote SET status = ? WHERE quote_id = ?',
        ['accepted', quoteId],
        (err2) => {
          if (err2) {
            console.error('DB error on update quote:', err2);
            return res.status(500).json({ message: 'Server error' });
          }

          const serviceDatetime = quote.preferred_datetime || now;

          db.query(
            `INSERT INTO \`Order\`
             (quote_id, service_datetime, status, created_at)
             VALUES (?, ?, ?, ?)`,
            [quoteId, serviceDatetime, 'scheduled', now],
            (err3, result3) => {
              if (err3) {
                console.error('DB error on create order:', err3);
                return res.status(500).json({ message: 'Server error' });
              }

              db.query(
                'UPDATE ServiceRequest SET status = ? WHERE request_id = ?',
                ['accepted', quote.request_id],
                (err4) => {
                  if (err4) {
                    console.error('DB error on update request status:', err4);
                  }
                  return res.status(200).json({
                    message: 'Quote accepted, order created',
                    order_id: result3.insertId
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// CLIENT: LIST MY BILLS

app.get('/api/my/bills', authMiddleware, (req, res) => {
  const clientId = req.user.client_id;

  db.query(
    `SELECT b.*, o.order_id, q.quote_id, r.request_id, r.service_address
     FROM Bill b
     JOIN \`Order\` o ON b.order_id = o.order_id
     JOIN Quote q ON o.quote_id = q.quote_id
     JOIN ServiceRequest r ON q.request_id = r.request_id
     WHERE r.client_id = ?
     ORDER BY b.created_at DESC`,
    [clientId],
    (err, results) => {
      if (err) {
        console.error('DB error on list bills:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      return res.json(results);
    }
  );
});

// CLIENT: PAY BILL

app.post('/api/bills/:id/pay', authMiddleware, (req, res) => {
  const billId = req.params.id;
  const clientId = req.user.client_id;
  const now = new Date();

  db.query(
    `SELECT b.*, r.client_id
     FROM Bill b
     JOIN \`Order\` o ON b.order_id = o.order_id
     JOIN Quote q ON o.quote_id = q.quote_id
     JOIN ServiceRequest r ON q.request_id = r.request_id
     WHERE b.bill_id = ?`,
    [billId],
    (err, results) => {
      if (err) {
        console.error('DB error on select bill:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Bill not found' });
      }

      const bill = results[0];

      if (bill.client_id !== clientId) {
        return res.status(403).json({ message: 'Not your bill' });
      }

      if (bill.status === 'paid') {
        return res.status(400).json({ message: 'Bill already paid' });
      }

      db.query(
        `INSERT INTO Payment (bill_id, amount_paid, payment_time, status)
         VALUES (?, ?, ?, ?)`,
        [billId, bill.amount, now, 'success'],
        (err2) => {
          if (err2) {
            console.error('DB error on insert payment:', err2);
            return res.status(500).json({ message: 'Server error' });
          }

          db.query(
            'UPDATE Bill SET status = ? WHERE bill_id = ?',
            ['paid', billId],
            (err3) => {
              if (err3) {
                console.error('DB error on update bill status:', err3);
                return res.status(500).json({ message: 'Server error' });
              }

              return res.status(200).json({ message: 'Bill paid successfully' });
            }
          );
        }
      );
    }
  );
});

// CLIENT: DISPUTE BILL

app.post('/api/bills/:id/dispute', authMiddleware, (req, res) => {
  const billId = req.params.id;
  const clientId = req.user.client_id;
  const { note } = req.body;
  const now = new Date();

  if (!note || !note.trim()) {
    return res.status(400).json({ message: 'Dispute note is required' });
  }

  db.query(
    `SELECT b.*, r.client_id
     FROM Bill b
     JOIN \`Order\` o ON b.order_id = o.order_id
     JOIN Quote q ON o.quote_id = q.quote_id
     JOIN ServiceRequest r ON q.request_id = r.request_id
     WHERE b.bill_id = ?`,
    [billId],
    (err, results) => {
      if (err) {
        console.error('DB error on select bill for dispute:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Bill not found' });
      }

      const bill = results[0];

      if (bill.client_id !== clientId) {
        return res.status(403).json({ message: 'Not your bill' });
      }

      db.query(
        `INSERT INTO BillMessage (bill_id, sender, message_text, created_at)
         VALUES (?, 'client', ?, ?)`,
        [billId, note, now],
        (err2) => {
          if (err2) {
            console.error('DB error on insert bill message:', err2);
            return res.status(500).json({ message: 'Server error' });
          }

          db.query(
            'UPDATE Bill SET status = ? WHERE bill_id = ?',
            ['in_dispute', billId],
            (err3) => {
              if (err3) {
                console.error('DB error on update bill to dispute:', err3);
                return res.status(500).json({ message: 'Server error' });
              }

              return res.status(200).json({ message: 'Bill disputed with note' });
            }
          );
        }
      );
    }
  );
});

// ADMIN: PENDING REQUESTS 

app.get('/api/admin/requests/pending', authMiddleware, adminMiddleware, (req, res) => {
  db.query(
    `SELECT r.*, c.first_name, c.last_name, c.username
     FROM ServiceRequest r
     JOIN Client c ON r.client_id = c.client_id
     WHERE r.status = 'pending'
     ORDER BY r.preferred_datetime ASC`,
    (err, results) => {
      if (err) {
        console.error('DB error on admin pending:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      return res.json(results);
    }
  );
});

// ADMIN: CREATE QUOTE 

app.post('/api/admin/quotes', authMiddleware, adminMiddleware, (req, res) => {
  const { request_id, quoted_price, scheduled_time_window, note } = req.body;

  if (!request_id || !quoted_price || !scheduled_time_window) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const createdAt = new Date();
  const status = 'pending';

  db.query(
    `INSERT INTO Quote (request_id, quoted_price, scheduled_time_window, status, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [request_id, quoted_price, scheduled_time_window, status, createdAt],
    (err, result) => {
      if (err) {
        console.error('DB error on create quote:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      const newQuoteId = result.insertId;

      if (note && note.trim() !== '') {
        db.query(
          `INSERT INTO QuoteMessage (quote_id, sender, message_text, created_at)
           VALUES (?, 'admin', ?, ?)`,
          [newQuoteId, note, createdAt],
          (msgErr) => {
            if (msgErr) console.error('DB error on quote message:', msgErr);
          }
        );
      }

      return res.status(201).json({
        message: 'Quote created successfully',
        quote_id: newQuoteId
      });
    }
  );
});

// ADMIN: LIST ORDERS 

app.get('/api/admin/orders', authMiddleware, adminMiddleware, (req, res) => {
  db.query(
    `SELECT o.*, q.quote_id, r.request_id, r.service_address, r.number_of_rooms,
            r.preferred_datetime, c.first_name, c.last_name, c.username
     FROM \`Order\` o
     JOIN Quote q ON o.quote_id = q.quote_id
     JOIN ServiceRequest r ON q.request_id = r.request_id
     JOIN Client c ON r.client_id = c.client_id
     ORDER BY o.created_at DESC`,
    (err, results) => {
      if (err) {
        console.error('DB error on admin orders:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      return res.json(results);
    }
  );
});

// ADMIN: COMPLETE ORDER & CREATE BILL 

app.post('/api/admin/orders/:id/complete-and-bill', authMiddleware, adminMiddleware, (req, res) => {
  const orderId = req.params.id;
  const { amount, note } = req.body;
  const now = new Date();

  if (!amount) {
    return res.status(400).json({ message: 'Amount is required' });
  }

  db.query(
    'SELECT * FROM `Order` WHERE order_id = ?',
    [orderId],
    (err, results) => {
      if (err) {
        console.error('DB error on select order:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }

      const order = results[0];

      db.query(
        'UPDATE `Order` SET status = ? WHERE order_id = ?',
        ['completed', orderId],
        (err2) => {
          if (err2) {
            console.error('DB error on update order:', err2);
            return res.status(500).json({ message: 'Server error' });
          }

          db.query(
            `INSERT INTO Bill (order_id, amount, status, created_at)
             VALUES (?, ?, ?, ?)`,
            [orderId, amount, 'pending', now],
            (err3, result3) => {
              if (err3) {
                console.error('DB error on create bill:', err3);
                return res.status(500).json({ message: 'Server error' });
              }

              const billId = result3.insertId;

              if (note && note.trim()) {
                db.query(
                  `INSERT INTO BillMessage (bill_id, sender, message_text, created_at)
                   VALUES (?, 'admin', ?, ?)`,
                  [billId, note, now],
                  (err4) => {
                    if (err4) {
                      console.error('DB error on admin bill message:', err4);
                    }
                    return res.status(200).json({
                      message: 'Order completed and bill created',
                      bill_id: billId
                    });
                  }
                );
              } else {
                return res.status(200).json({
                  message: 'Order completed and bill created',
                  bill_id: billId
                });
              }
            }
          );
        }
      );
    }
  );
});

// ADMIN: REVISE BILL 

app.post('/api/admin/bills/:id/revise', authMiddleware, adminMiddleware, (req, res) => {
  const billId = req.params.id;
  const { new_amount, note } = req.body;
  const now = new Date();

  if (!new_amount) {
    return res.status(400).json({ message: 'New amount is required' });
  }

  db.query(
    'SELECT * FROM Bill WHERE bill_id = ?',
    [billId],
    (err, results) => {
      if (err) {
        console.error('DB error on select bill for revise:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Bill not found' });
      }

      db.query(
        'UPDATE Bill SET amount = ?, status = ? WHERE bill_id = ?',
        [new_amount, 'pending', billId],
        (err2) => {
          if (err2) {
            console.error('DB error on update bill amount:', err2);
            return res.status(500).json({ message: 'Server error' });
          }

          if (note && note.trim()) {
            db.query(
              `INSERT INTO BillMessage (bill_id, sender, message_text, created_at)
               VALUES (?, 'admin', ?, ?)`,
              [billId, note, now],
              (err3) => {
                if (err3) {
                  console.error('DB error on revise note:', err3);
                }
                return res.status(200).json({ message: 'Bill revised' });
              }
            );
          } else {
            return res.status(200).json({ message: 'Bill revised' });
          }
        }
      );
    }
  );
});

// DASHBOARD QUERIES (ADMIN) 

// Frequent clients – completed service orders
app.get('/api/admin/dashboard/frequent-clients', authMiddleware, adminMiddleware, (req, res) => {
  db.query(
    `SELECT c.client_id, c.first_name, c.last_name, c.username,
            COUNT(o.order_id) AS completed_orders
     FROM Client c
     JOIN ServiceRequest r ON c.client_id = r.client_id
     JOIN Quote q ON r.request_id = q.request_id
     JOIN \`Order\` o ON q.quote_id = o.quote_id
     WHERE o.status = 'completed'
     GROUP BY c.client_id
     ORDER BY completed_orders DESC`,
    (err, results) => {
      if (err) {
        console.error('DB error on frequent clients:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      return res.json(results);
    }
  );
});

// Uncommitted clients – 3+ requests, no completed order
app.get('/api/admin/dashboard/uncommitted-clients', authMiddleware, adminMiddleware, (req, res) => {
  db.query(
    `SELECT c.client_id, c.first_name, c.last_name, c.username,
            COUNT(DISTINCT r.request_id) AS requests_count,
            COUNT(DISTINCT o.order_id) AS completed_orders
     FROM Client c
     JOIN ServiceRequest r ON c.client_id = r.client_id
     LEFT JOIN Quote q ON r.request_id = q.request_id
     LEFT JOIN \`Order\` o ON q.quote_id = o.quote_id AND o.status = 'completed'
     GROUP BY c.client_id
     HAVING requests_count >= 3 AND completed_orders = 0`,
    (err, results) => {
      if (err) {
        console.error('DB error on uncommitted clients:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      return res.json(results);
    }
  );
});

// This month’s accepted quotes – based on order.created_at this month
app.get('/api/admin/dashboard/accepted-quotes', authMiddleware, adminMiddleware, (req, res) => {
  db.query(
    `SELECT q.*, o.created_at AS accepted_time, c.first_name, c.last_name, c.username
     FROM Quote q
     JOIN \`Order\` o ON q.quote_id = o.quote_id
     JOIN ServiceRequest r ON q.request_id = r.request_id
     JOIN Client c ON r.client_id = c.client_id
     WHERE q.status = 'accepted'
       AND YEAR(o.created_at) = YEAR(NOW())
       AND MONTH(o.created_at) = MONTH(NOW())
     ORDER BY o.created_at DESC`,
    (err, results) => {
      if (err) {
        console.error('DB error on accepted quotes:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      return res.json(results);
    }
  );
});

// Prospective clients – registered, no requests
app.get('/api/admin/dashboard/prospective-clients', authMiddleware, adminMiddleware, (req, res) => {
  db.query(
    `SELECT c.client_id, c.first_name, c.last_name, c.username, c.email
     FROM Client c
     LEFT JOIN ServiceRequest r ON c.client_id = r.client_id
     WHERE r.request_id IS NULL`,
    (err, results) => {
      if (err) {
        console.error('DB error on prospective clients:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      return res.json(results);
    }
  );
});

// Largest job – requests with max rooms that were completed
app.get('/api/admin/dashboard/largest-job', authMiddleware, adminMiddleware, (req, res) => {
  db.query(
    `SELECT r.*, c.first_name, c.last_name, c.username
     FROM ServiceRequest r
     JOIN Quote q ON r.request_id = q.request_id
     JOIN \`Order\` o ON q.quote_id = o.quote_id
     JOIN Client c ON r.client_id = c.client_id
     WHERE o.status = 'completed'
       AND r.number_of_rooms = (
         SELECT MAX(r2.number_of_rooms)
         FROM ServiceRequest r2
         JOIN Quote q2 ON r2.request_id = q2.request_id
         JOIN \`Order\` o2 ON q2.quote_id = o2.quote_id
         WHERE o2.status = 'completed'
       )`,
    (err, results) => {
      if (err) {
        console.error('DB error on largest job:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      return res.json(results);
    }
  );
});

// Overdue bills – unpaid older than 7 days
app.get('/api/admin/dashboard/overdue-bills', authMiddleware, adminMiddleware, (req, res) => {
  db.query(
    `SELECT b.*, c.first_name, c.last_name, c.username
     FROM Bill b
     JOIN \`Order\` o ON b.order_id = o.order_id
     JOIN Quote q ON o.quote_id = q.quote_id
     JOIN ServiceRequest r ON q.request_id = r.request_id
     JOIN Client c ON r.client_id = c.client_id
     WHERE b.status <> 'paid'
       AND b.created_at < (NOW() - INTERVAL 7 DAY)`,
    (err, results) => {
      if (err) {
        console.error('DB error on overdue bills:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      return res.json(results);
    }
  );
});

// Bad clients – have at least one overdue bill
app.get('/api/admin/dashboard/bad-clients', authMiddleware, adminMiddleware, (req, res) => {
  db.query(
    `SELECT DISTINCT c.client_id, c.first_name, c.last_name, c.username
     FROM Client c
     JOIN ServiceRequest r ON c.client_id = r.client_id
     JOIN Quote q ON r.request_id = q.request_id
     JOIN \`Order\` o ON q.quote_id = o.quote_id
     JOIN Bill b ON o.order_id = b.order_id
     WHERE b.status <> 'paid'
       AND b.created_at < (NOW() - INTERVAL 7 DAY)`,
    (err, results) => {
      if (err) {
        console.error('DB error on bad clients:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      return res.json(results);
    }
  );
});

// Good clients – always paid within 24 hours
app.get('/api/admin/dashboard/good-clients', authMiddleware, adminMiddleware, (req, res) => {
  db.query(
    `SELECT DISTINCT c.client_id, c.first_name, c.last_name, c.username
     FROM Client c
     WHERE EXISTS (
       SELECT 1
       FROM Bill b
       JOIN \`Order\` o ON b.order_id = o.order_id
       JOIN Quote q ON o.quote_id = q.quote_id
       JOIN ServiceRequest r ON q.request_id = r.request_id
       WHERE r.client_id = c.client_id
     )
     AND NOT EXISTS (
       SELECT 1
       FROM Bill b
       JOIN \`Order\` o ON b.order_id = o.order_id
       JOIN Quote q ON o.quote_id = q.quote_id
       JOIN ServiceRequest r ON q.request_id = r.request_id
       LEFT JOIN Payment p
         ON p.bill_id = b.bill_id AND p.status = 'success'
       WHERE r.client_id = c.client_id
         AND (
           p.payment_id IS NULL
           OR TIMESTAMPDIFF(HOUR, b.created_at, p.payment_time) > 24
         )
     )`,
    (err, results) => {
      if (err) {
        console.error('DB error on good clients:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      return res.json(results);
    }
  );
});

//  START SERVER 

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});