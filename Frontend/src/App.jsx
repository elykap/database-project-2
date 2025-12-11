import { useState, useEffect } from 'react';

function App() {
  const [registerForm, setRegisterForm] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    address: '',
    phone: '',
    email: '',
    credit_card_info: '',
  });

  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  });

  const [requestForm, setRequestForm] = useState({
    service_address: '',
    cleaning_type: 'basic',
    number_of_rooms: '',
    preferred_datetime: '',
    proposed_budget: '',
    notes: '',
  });
  const [requestPhotos, setRequestPhotos] = useState([]);

  const [myRequests, setMyRequests] = useState([]);
  const [myQuotes, setMyQuotes] = useState([]);
  const [myBills, setMyBills] = useState([]);
  const [quoteMessages, setQuoteMessages] = useState({});
  const [billMessages, setBillMessages] = useState({});

  const [adminRequests, setAdminRequests] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);
  const [adminQuotes, setAdminQuotes] = useState([]);
  const [adminBills, setAdminBills] = useState([]);

  // dashboard states
  const [freqClients, setFreqClients] = useState([]);
  const [uncommittedClients, setUncommittedClients] = useState([]);
  const [acceptedQuotes, setAcceptedQuotes] = useState([]);
  const [prospectiveClients, setProspectiveClients] = useState([]);
  const [largestJobs, setLargestJobs] = useState([]);
  const [overdueBills, setOverdueBills] = useState([]);
  const [badClients, setBadClients] = useState([]);
  const [goodClients, setGoodClients] = useState([]);
  const [acceptedMonth, setAcceptedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  const [message, setMessage] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [clientInfo, setClientInfo] = useState(
    localStorage.getItem('clientInfo')
      ? JSON.parse(localStorage.getItem('clientInfo'))
      : null
  );

  const API_BASE = 'http://localhost:3001';

  useEffect(() => {
    if (token) {
      fetchMyRequests();
      fetchMyQuotes();
      fetchMyBills();
      if (clientInfo?.is_admin) {
        fetchAdminPending();
        fetchAdminOrders();
        fetchAdminQuotes();
        fetchAdminBills();
        fetchDashboard();
      }
    } else {
      setMyRequests([]);
      setMyQuotes([]);
      setMyBills([]);
      setAdminRequests([]);
      setAdminOrders([]);
      setAdminQuotes([]);
      setAdminBills([]);
      setFreqClients([]);
      setUncommittedClients([]);
      setAcceptedQuotes([]);
      setProspectiveClients([]);
      setLargestJobs([]);
      setOverdueBills([]);
      setBadClients([]);
      setGoodClients([]);
      const now = new Date();
      setAcceptedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, clientInfo?.is_admin]);

  //  form handlers 

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRequestChange = (e) => {
    const { name, value } = e.target;
    setRequestForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    setRequestPhotos(files);
  };

  //  API calls 

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || 'Registration failed');
      } else {
        setMessage('Registration successful. You can now log in.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error connecting to server');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || 'Login failed');
      } else {
        setMessage('Login successful');
        setToken(data.token);
        setClientInfo(data.client);
        localStorage.setItem('token', data.token);
        localStorage.setItem('clientInfo', JSON.stringify(data.client));
      }
    } catch (err) {
      console.error(err);
      setMessage('Error connecting to server');
    }
  };

  const handleLogout = () => {
    setToken('');
    setClientInfo(null);
    setMyRequests([]);
    setMyQuotes([]);
    setMyBills([]);
    setQuoteMessages({});
    setBillMessages({});
    setRequestPhotos([]);
    setAdminRequests([]);
    setAdminOrders([]);
    setAdminQuotes([]);
    setAdminBills([]);
    setFreqClients([]);
    setUncommittedClients([]);
    setAcceptedQuotes([]);
    setProspectiveClients([]);
    setLargestJobs([]);
    setOverdueBills([]);
    setBadClients([]);
    setGoodClients([]);
    localStorage.removeItem('token');
    localStorage.removeItem('clientInfo');
    setMessage('Logged out');
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const formData = new FormData();
      Object.entries(requestForm).forEach(([key, value]) => formData.append(key, value));
      requestPhotos.forEach((file) => formData.append('photos', file));

      const res = await fetch(`${API_BASE}/api/requests`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || 'Failed to create request');
      } else {
        setMessage('Service request created');
        setRequestForm({
          service_address: '',
          cleaning_type: 'basic',
          number_of_rooms: '',
          preferred_datetime: '',
          proposed_budget: '',
          notes: '',
        });
        setRequestPhotos([]);
        fetchMyRequests();
        if (clientInfo?.is_admin) {
          fetchAdminPending();
        }
      }
    } catch (err) {
      console.error(err);
      setMessage('Error connecting to server');
    }
  };

  const handleAcceptQuote = async (quoteId) => {
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/quotes/${quoteId}/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || 'Failed to accept quote');
      } else {
        setMessage('Quote accepted, order created');
        fetchMyQuotes();
        fetchMyRequests();
      }
    } catch (err) {
      console.error(err);
      setMessage('Error connecting to server');
    }
  };

  const handlePayBill = async (billId) => {
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/bills/${billId}/pay`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || 'Failed to pay bill');
      } else {
        setMessage('Bill paid successfully');
        fetchMyBills();
      }
    } catch (err) {
      console.error(err);
      setMessage('Error connecting to server');
    }
  };

  const handleDisputeBill = async (billId) => {
    const note = prompt('Enter dispute note:');
    if (!note) return;
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/bills/${billId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message_text: note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || 'Failed to dispute bill');
      } else {
        setMessage('Bill disputed');
        fetchMyBills();
        fetchBillMessages(billId);
      }
    } catch (err) {
      console.error(err);
      setMessage('Error connecting to server');
    }
  };

  const handlePromoteUser = async () => {
    const username = prompt('Enter username to promote to admin:');
    if (!username) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to promote user');
      } else {
        alert('User promoted to admin');
      }
    } catch (err) {
      console.error(err);
      alert('Error promoting user');
    }
  };

  const handleSeedFirstAdmin = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/seed-first-admin`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || 'Unable to become admin');
      } else {
        setMessage('You are now the first admin. Please log out and log back in to refresh permissions.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error seeding admin');
    }
  };

  const handleSendQuoteMessage = async (quoteId, action) => {
    const text = prompt('Enter message:');
    if (!text) return;
    try {
      const res = await fetch(`${API_BASE}/api/quotes/${quoteId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message_text: text, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to send message');
      } else {
        fetchQuoteMessages(quoteId);
        fetchMyQuotes();
        if (clientInfo?.is_admin) {
          fetchAdminQuotes();
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error sending message');
    }
  };

  const handleSendBillMessage = async (billId) => {
    const text = prompt('Add message about this bill:');
    if (!text) return;
    try {
      const res = await fetch(`${API_BASE}/api/bills/${billId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message_text: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to send message');
      } else {
        fetchBillMessages(billId);
        if (clientInfo?.is_admin) {
          fetchAdminBills();
        } else {
          fetchMyBills();
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error sending bill message');
    }
  };

  const handleAdminCompleteAndBill = async (orderId) => {
    const amount = prompt('Enter bill amount:');
    if (!amount) return;
    const note = prompt('Optional note for bill:') || '';
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${orderId}/complete-and-bill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to complete and bill');
      } else {
        alert('Order completed and bill created');
        fetchAdminOrders();
        fetchAdminBills();
        fetchDashboard();
      }
    } catch (err) {
      console.error(err);
      alert('Error completing order');
    }
  };

  const handleAdminReviseBill = async () => {
    const billId = prompt('Enter bill ID to revise:');
    if (!billId) return;
    const new_amount = prompt('Enter new amount:');
    if (!new_amount) return;
    const note = prompt('Optional revision note:') || '';
    try {
      const res = await fetch(`${API_BASE}/api/admin/bills/${billId}/revise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ new_amount, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to revise bill');
      } else {
        alert('Bill revised');
        fetchDashboard();
        fetchAdminBills();
      }
    } catch (err) {
      console.error(err);
      alert('Error revising bill');
    }
  };

  const fetchMyRequests = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/my/requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setMyRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyQuotes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/my/quotes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setMyQuotes(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyBills = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/my/bills`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setMyBills(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuoteMessages = async (quoteId) => {
    try {
      const res = await fetch(`${API_BASE}/api/quotes/${quoteId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setQuoteMessages((prev) => ({ ...prev, [quoteId]: data }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBillMessages = async (billId) => {
    try {
      const res = await fetch(`${API_BASE}/api/bills/${billId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setBillMessages((prev) => ({ ...prev, [billId]: data }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminPending = async () => {
    if (!clientInfo?.is_admin) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/requests/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setAdminRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminOrders = async () => {
    if (!clientInfo?.is_admin) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setAdminOrders(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminQuotes = async () => {
    if (!clientInfo?.is_admin) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/quotes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setAdminQuotes(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminBills = async () => {
    if (!clientInfo?.is_admin) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/bills`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setAdminBills(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDashboard = async (customMonth) => {
    if (!clientInfo?.is_admin) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const monthValue = customMonth || acceptedMonth;
      let acceptedUrl = `${API_BASE}/api/admin/dashboard/accepted-quotes`;
      if (monthValue) {
        const [yr, mo] = monthValue.split('-');
        if (yr && mo) {
          acceptedUrl += `?year=${yr}&month=${Number(mo)}`;
        }
      }

      let res = await fetch(`${API_BASE}/api/admin/dashboard/frequent-clients`, { headers });
      if (res.ok) setFreqClients(await res.json());

      res = await fetch(`${API_BASE}/api/admin/dashboard/uncommitted-clients`, { headers });
      if (res.ok) setUncommittedClients(await res.json());

      res = await fetch(acceptedUrl, { headers });
      if (res.ok) setAcceptedQuotes(await res.json());

      res = await fetch(`${API_BASE}/api/admin/dashboard/prospective-clients`, { headers });
      if (res.ok) setProspectiveClients(await res.json());

      res = await fetch(`${API_BASE}/api/admin/dashboard/largest-job`, { headers });
      if (res.ok) setLargestJobs(await res.json());

      res = await fetch(`${API_BASE}/api/admin/dashboard/overdue-bills`, { headers });
      if (res.ok) setOverdueBills(await res.json());

      res = await fetch(`${API_BASE}/api/admin/dashboard/bad-clients`, { headers });
      if (res.ok) setBadClients(await res.json());

      res = await fetch(`${API_BASE}/api/admin/dashboard/good-clients`, { headers });
      if (res.ok) setGoodClients(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  // Login/Register page
  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-hero">
          <h1>Cleaning Service App</h1>
          {message && <div className="notice" style={{ maxWidth: '520px' }}>{message}</div>}
        </div>

        <div className="grid-two">
          {/* Register */}
          <form onSubmit={handleRegisterSubmit} className="card">
            <h2>Register Client</h2>

            <label className="field-label">Username
              <input
                className="input"
                name="username"
                value={registerForm.username}
                onChange={handleRegisterChange}
                required
              />
            </label>

            <label className="field-label">Password
              <input
                className="input"
                type="password"
                name="password"
                value={registerForm.password}
                onChange={handleRegisterChange}
                required
              />
            </label>

            <label className="field-label">First Name
              <input
                className="input"
                name="first_name"
                value={registerForm.first_name}
                onChange={handleRegisterChange}
                required
              />
            </label>

            <label className="field-label">Last Name
              <input
                className="input"
                name="last_name"
                value={registerForm.last_name}
                onChange={handleRegisterChange}
                required
              />
            </label>

            <label className="field-label">Address
              <input
                className="input"
                name="address"
                value={registerForm.address}
                onChange={handleRegisterChange}
                required
              />
            </label>

            <label className="field-label">Phone
              <input
                className="input"
                name="phone"
                value={registerForm.phone}
                onChange={handleRegisterChange}
              />
            </label>

            <label className="field-label">Email
              <input
                className="input"
                type="email"
                name="email"
                value={registerForm.email}
                onChange={handleRegisterChange}
                required
              />
            </label>

            <label className="field-label">Credit Card Info
              <input
                className="input"
                name="credit_card_info"
                value={registerForm.credit_card_info}
                onChange={handleRegisterChange}
              />
            </label>

            <button type="submit" className="btn">Register</button>
          </form>

          {/* Login */}
          <form onSubmit={handleLoginSubmit} className="card">
            <h2>Login</h2>

            <label className="field-label">Username
              <input
                className="input"
                name="username"
                value={loginForm.username}
                onChange={handleLoginChange}
                required
              />
            </label>

            <label className="field-label">Password
              <input
                className="input"
                type="password"
                name="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                required
              />
            </label>

            <button type="submit" className="btn">Login</button>
          </form>
        </div>
      </div>
    );
  }

  // Authenticated views
  return (
    <div className="page">
      <div className="header">
        <div>
          <h1>Cleaning Service App</h1>
        </div>
        <div className="header-actions">
          <div className="pill">
            {clientInfo?.is_admin ? 'Admin (Anna)' : 'Client'} — {clientInfo?.username}
          </div>
          <button type="button" onClick={handleLogout} className="btn ghost">
            Logout
          </button>
        </div>
      </div>

      {message && <div className="notice">{message}</div>}

      {!clientInfo?.is_admin && (
        <div className="card" style={{ marginTop: '0.5rem' }}>
          <h3>Admin Setup</h3>
          <p className="meta">If no admins exist yet, you can become the first admin here.</p>
          <button type="button" className="btn btn-small" onClick={handleSeedFirstAdmin}>
            Become First Admin
          </button>
        </div>
      )}

      {/* CLIENT VIEW */}
      {!clientInfo?.is_admin && (
        <>
          {/* Requests + Quotes */}
          <div className="grid-two section-spaced">
            <form onSubmit={handleRequestSubmit} className="card">
              <h2>Create Service Request</h2>

              <label className="field-label">Service Address
                <input
                  className="input"
                  name="service_address"
                  value={requestForm.service_address}
                  onChange={handleRequestChange}
                  required
                />
              </label>

              <label className="field-label">Cleaning Type
                <select
                  className="input"
                  name="cleaning_type"
                  value={requestForm.cleaning_type}
                  onChange={handleRequestChange}
                >
                  <option value="basic">Basic</option>
                  <option value="deep">Deep Cleaning</option>
                  <option value="move-out">Move-out</option>
                </select>
              </label>

              <label className="field-label">Number of Rooms
                <input
                  className="input"
                  type="number"
                  name="number_of_rooms"
                  value={requestForm.number_of_rooms}
                  onChange={handleRequestChange}
                  required
                />
              </label>

              <label className="field-label">Preferred Date &amp; Time
                <input
                  className="input"
                  type="datetime-local"
                  name="preferred_datetime"
                  value={requestForm.preferred_datetime}
                  onChange={handleRequestChange}
                  required
                />
              </label>

              <label className="field-label">Proposed Budget
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  name="proposed_budget"
                  value={requestForm.proposed_budget}
                  onChange={handleRequestChange}
                  required
                />
              </label>

              <label className="field-label">Notes
                <textarea
                  className="input"
                  style={{ minHeight: '60px' }}
                  name="notes"
                  value={requestForm.notes}
                  onChange={handleRequestChange}
                />
              </label>

              <label className="field-label">Upload Photos (max 5)
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="input"
                />
              </label>

              <button type="submit" className="btn">Submit Request</button>
            </form>

            <div className="card">
              <h2>My Service Requests & Quotes</h2>
              {myRequests.length === 0 && <p>No requests yet.</p>}
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {myRequests.map((r) => {
                  const relatedQuotes = myQuotes.filter(
                    (q) => q.request_id === r.request_id
                  );
                  return (
                    <li
                      key={r.request_id}
                      className="list-item"
                    >
                      <div><strong>Address:</strong> {r.service_address}</div>
                      <div><strong>Type:</strong> {r.cleaning_type}</div>
                      <div><strong>Rooms:</strong> {r.number_of_rooms}</div>
                      <div>
                        <strong>Preferred:</strong>{' '}
                        {new Date(r.preferred_datetime).toLocaleString()}
                      </div>
                      <div>
                        <strong>Budget:</strong>{' '}
                        ${Number(r.proposed_budget).toFixed(2)}
                      </div>
                      <div><strong>Status:</strong> {r.status}</div>
                      {r.notes && <div><strong>Notes:</strong> {r.notes}</div>}
                      {r.rejection_note && (
                        <div style={{ color: '#ff9e9e' }}>
                          <strong>Rejected Reason:</strong> {r.rejection_note}
                        </div>
                      )}
                      {r.photos && r.photos.length > 0 && (
                        <div style={{ marginTop: '0.3rem' }}>
                          <strong>Photos:</strong>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {r.photos.map((p) => (
                              <img
                                key={p.photo_id}
                                src={`http://localhost:3001${p.file_url}`}
                                alt="request"
                                style={{ width: '80px', height: '80px', objectFit: 'cover', border: '1px solid #333' }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ marginTop: '0.5rem' }}>
                        <strong>Quotes:</strong>
                        {relatedQuotes.length === 0 && (
                          <div>None yet.</div>
                        )}
                        {relatedQuotes.length > 0 && (
                          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                            {relatedQuotes.map((q) => (
                              <li key={q.quote_id} style={{ marginTop: '0.3rem' }}>
                                <div>
                                  Price: ${Number(q.quoted_price).toFixed(2)} | Window:{' '}
                                  {q.scheduled_time_window} | Status: {q.status}
                                </div>
                                <div style={{ marginTop: '0.3rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    className="btn btn-small"
                                    onClick={() => {
                                      fetchQuoteMessages(q.quote_id);
                                    }}
                                  >
                                    View Conversation
                                  </button>
                                  {q.status === 'pending' && (
                                    <>
                                      <button
                                        type="button"
                                        className="btn btn-small"
                                        onClick={() => handleAcceptQuote(q.quote_id)}
                                      >
                                        Accept Quote
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-small"
                                        onClick={() => handleSendQuoteMessage(q.quote_id)}
                                      >
                                        Send Counter/Note
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-small ghost"
                                        onClick={() => handleSendQuoteMessage(q.quote_id, 'cancel')}
                                      >
                                        Cancel Quote
                                      </button>
                                    </>
                                  )}
                                </div>
                                {quoteMessages[q.quote_id] && (
                                  <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '0.3rem' }}>
                                    {quoteMessages[q.quote_id].map((m) => (
                                      <li key={m.quote_message_id} style={{ fontSize: '0.9rem' }}>
                                        [{m.sender}] {m.message_text} ({new Date(m.created_at).toLocaleString()})
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Bills */}
          <div className="section-spaced">
            <div className="card">
              <h2>My Bills</h2>
              {myBills.length === 0 && <p>No bills yet.</p>}
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {myBills.map((b) => (
                  <li
                    key={b.bill_id}
                    className="list-item"
                  >
                    <div><strong>Bill ID:</strong> {b.bill_id}</div>
                    <div><strong>Order ID:</strong> {b.order_id}</div>
                    <div><strong>Service Address:</strong> {b.service_address}</div>
                    <div>
                      <strong>Amount:</strong> ${Number(b.amount).toFixed(2)}
                    </div>
                    <div>
                      <strong>Created:</strong>{' '}
                      {new Date(b.created_at).toLocaleString()}
                    </div>
                    <div><strong>Status:</strong> {b.status}</div>
                    {b.status !== 'paid' && (
                      <div style={{ marginTop: '0.3rem' }}>
                        <button
                          type="button"
                          className="btn btn-small"
                          onClick={() => handlePayBill(b.bill_id)}
                        >
                          Pay
                        </button>
                        <button
                          type="button"
                          className="btn btn-small ghost"
                          onClick={() => handleDisputeBill(b.bill_id)}
                        >
                          Dispute
                        </button>
                      </div>
                    )}
                    <div style={{ marginTop: '0.3rem' }}>
                      <button
                        type="button"
                        className="btn btn-small"
                        onClick={() => fetchBillMessages(b.bill_id)}
                      >
                        View Conversation
                      </button>
                      <button
                        type="button"
                        className="btn btn-small"
                        onClick={() => handleSendBillMessage(b.bill_id)}
                      >
                        Add Message
                      </button>
                    </div>
                    {billMessages[b.bill_id] && (
                      <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '0.3rem' }}>
                        {billMessages[b.bill_id].map((m) => (
                          <li key={m.bill_message_id} style={{ fontSize: '0.9rem' }}>
                            [{m.sender}] {m.message_text} ({new Date(m.created_at).toLocaleString()})
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {/* ADMIN VIEW */}
      {token && clientInfo?.is_admin && (
        <>
          {/* Pending requests + quote creation */}
          <div className="section-spaced">
            <div className="card">
              <h2>Admin: Pending Service Requests</h2>
              {adminRequests.length === 0 && <p>No pending requests.</p>}
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {adminRequests.map((r) => (
                  <li
                    key={r.request_id}
                    className="list-item"
                  >
                    <div>
                      <strong>Client:</strong>{' '}
                      {r.first_name} {r.last_name} ({r.username})
                    </div>
                    <div><strong>Address:</strong> {r.service_address}</div>
                    <div><strong>Type:</strong> {r.cleaning_type}</div>
                    <div><strong>Rooms:</strong> {r.number_of_rooms}</div>
                    <div>
                      <strong>Preferred:</strong>{' '}
                      {new Date(r.preferred_datetime).toLocaleString()}
                    </div>
                    <div>
                      <strong>Budget:</strong>{' '}
                      ${Number(r.proposed_budget).toFixed(2)}
                    </div>
                    <div><strong>Status:</strong> {r.status}</div>
                    {r.notes && <div><strong>Notes:</strong> {r.notes}</div>}
                    {r.photos && r.photos.length > 0 && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <strong>Photos:</strong>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {r.photos.map((p) => (
                            <img
                              key={p.photo_id}
                              src={`http://localhost:3001${p.file_url}`}
                              alt="request"
                              style={{ width: '80px', height: '80px', objectFit: 'cover', border: '1px solid #333' }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn btn-small"
                      style={{ marginTop: '0.5rem' }}
                      onClick={async () => {
                        const note = prompt('Enter rejection note:');
                        if (!note) return;
                        try {
                          const res = await fetch(`${API_BASE}/api/admin/requests/${r.request_id}/reject`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ note }),
                          });
                          const data = await res.json();
                          if (!res.ok) {
                            alert(data.message || 'Failed to reject request');
                          } else {
                            alert('Request rejected');
                            fetchAdminPending();
                          }
                        } catch (err) {
                          console.error(err);
                          alert('Error rejecting request');
                        }
                      }}
                    >
                      Reject with Note
                    </button>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const quoted_price = prompt('Enter quoted price:');
                        if (!quoted_price) return;
                        const scheduled_time_window = prompt(
                          'Enter scheduled time window (e.g. 2pm-4pm):'
                        );
                        if (!scheduled_time_window) return;
                        const note = prompt('Optional note or message:') || '';

                        try {
                          const res = await fetch(`${API_BASE}/api/admin/quotes`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                              request_id: r.request_id,
                              quoted_price,
                              scheduled_time_window,
                              note,
                            }),
                          });

                          const data = await res.json();
                          if (!res.ok) {
                            alert(data.message || 'Failed to create quote');
                          } else {
                            alert('Quote created successfully');
                            fetchAdminPending();
                            fetchAdminQuotes();
                          }
                        } catch (err) {
                          console.error(err);
                          alert('Error sending quote');
                        }
                      }}
                    >
                      <button
                        type="submit"
                        className="btn btn-small"
                        style={{ marginTop: '0.5rem' }}
                      >
                        Create Quote
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quotes negotiation */}
          <div className="section-spaced">
            <div className="card">
              <h2>Admin: Quotes</h2>
              {adminQuotes.length === 0 && <p>No quotes yet.</p>}
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {adminQuotes.map((q) => (
                  <li
                    key={q.quote_id}
                    className="list-item"
                  >
                    <div>
                      Quote #{q.quote_id} for {q.first_name} {q.last_name} ({q.username}) – Status: {q.status}
                    </div>
                    <div>Address: {q.service_address}</div>
                    <div>Price: ${Number(q.quoted_price).toFixed(2)} | Window: {q.scheduled_time_window}</div>
                    <div>Created: {new Date(q.created_at).toLocaleString()}</div>
                    <div style={{ marginTop: '0.3rem' }}>
                      <button
                        type="button"
                        className="btn btn-small"
                        style={{ marginRight: '0.3rem' }}
                        onClick={() => fetchQuoteMessages(q.quote_id)}
                      >
                        View Conversation
                      </button>
                      {q.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            className="btn btn-small"
                            style={{ marginRight: '0.3rem' }}
                            onClick={() => handleSendQuoteMessage(q.quote_id)}
                          >
                            Reply / Send Note
                          </button>
                          <button
                            type="button"
                            className="btn btn-small ghost"
                            onClick={() => handleSendQuoteMessage(q.quote_id, 'reject')}
                          >
                            Reject Quote
                          </button>
                        </>
                      )}
                    </div>
                    {quoteMessages[q.quote_id] && (
                      <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '0.3rem' }}>
                        {quoteMessages[q.quote_id].map((m) => (
                          <li key={m.quote_message_id} style={{ fontSize: '0.9rem' }}>
                            [{m.sender}] {m.message_text} ({new Date(m.created_at).toLocaleString()})
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Orders */}
          <div className="section-spaced">
            <div className="card">
              <h2>Admin: Orders</h2>
              {adminOrders.length === 0 && <p>No orders yet.</p>}
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {adminOrders.map((o) => (
                  <li
                    key={o.order_id}
                    className="list-item"
                  >
                    <div>
                      <strong>Order ID:</strong> {o.order_id} |{' '}
                      <strong>Status:</strong> {o.status}
                    </div>
                    <div>
                      <strong>Client:</strong>{' '}
                      {o.first_name} {o.last_name} ({o.username})
                    </div>
                    <div><strong>Service Address:</strong> {o.service_address}</div>
                    <div><strong>Rooms:</strong> {o.number_of_rooms}</div>
                    <div>
                      <strong>Service Date:</strong>{' '}
                      {new Date(o.service_datetime).toLocaleString()}
                    </div>
                    <div>
                      <strong>Created:</strong>{' '}
                      {new Date(o.created_at).toLocaleString()}
                    </div>
                    {o.status === 'scheduled' && (
                      <button
                        type="button"
                        className="btn btn-small"
                        style={{ marginTop: '0.3rem' }}
                        onClick={() => handleAdminCompleteAndBill(o.order_id)}
                      >
                        Complete & Create Bill
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bills management */}
          <div className="section-spaced">
            <div className="card">
              <h2>Admin: Bills</h2>
              {adminBills.length === 0 && <p>No bills yet.</p>}
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {adminBills.map((b) => (
                  <li
                    key={b.bill_id}
                    className="list-item"
                  >
                    <div>Bill #{b.bill_id} – {b.first_name} {b.last_name} ({b.username})</div>
                    <div>Order #{b.order_id} | Amount: ${Number(b.amount).toFixed(2)} | Status: {b.status}</div>
                    <div>Service Address: {b.service_address}</div>
                    <div>Created: {new Date(b.created_at).toLocaleString()}</div>
                    <div style={{ marginTop: '0.3rem' }}>
                      <button
                        type="button"
                        className="btn btn-small"
                        style={{ marginRight: '0.3rem' }}
                        onClick={() => fetchBillMessages(b.bill_id)}
                      >
                        View Conversation
                      </button>
                      <button
                        type="button"
                        className="btn btn-small"
                        onClick={() => handleSendBillMessage(b.bill_id)}
                      >
                        Respond / Add Note
                      </button>
                    </div>
                    {billMessages[b.bill_id] && (
                      <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '0.3rem' }}>
                        {billMessages[b.bill_id].map((m) => (
                          <li key={m.bill_message_id} style={{ fontSize: '0.9rem' }}>
                            [{m.sender}] {m.message_text} ({new Date(m.created_at).toLocaleString()})
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: '1rem' }}>
                <h4>Bill Tools</h4>
                <button
                  type="button"
                  className="btn"
                  onClick={handleAdminReviseBill}
                >
                  Revise a Bill (by ID)
                </button>
              </div>
            </div>
          </div>

          {/* Dashboard */}
          <div className="section-spaced">
            <div className="card">
              <h2>Admin Dashboard</h2>
              <button
                type="button"
                className="btn"
                onClick={fetchDashboard}
              >
                Refresh Dashboard
              </button>

              <div style={{ marginTop: '1rem' }}>
                <h3>Admin Tools</h3>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={handlePromoteUser}
                  >
                    Promote User to Admin
                  </button>
                </div>
                <p className="meta" style={{ marginTop: '0.3rem' }}>
                  Use these tools to manage admin access without direct SQL updates.
                </p>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h3>3. Frequent Clients (by completed orders)</h3>
                {freqClients.length === 0 && <p>None.</p>}
                <ul>
                  {freqClients.map((c) => (
                    <li key={c.client_id}>
                      {c.first_name} {c.last_name} ({c.username}) –{' '}
                      {c.completed_orders} completed orders
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h3>4. Uncommitted Clients (3+ requests, 0 completed orders)</h3>
                {uncommittedClients.length === 0 && <p>None.</p>}
                <ul>
                  {uncommittedClients.map((c) => (
                    <li key={c.client_id}>
                      {c.first_name} {c.last_name} ({c.username}) –{' '}
                      {c.requests_count} requests
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h3>5. This Month&apos;s Accepted Quotes</h3>
                <div className="grid-two" style={{ alignItems: 'end', gap: '0.6rem' }}>
                  <label className="field-label" style={{ marginTop: 0 }}>
                    Select Month
                    <input
                      type="month"
                      className="input"
                      value={acceptedMonth}
                      onChange={(e) => {
                        setAcceptedMonth(e.target.value);
                        fetchDashboard(e.target.value);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => fetchDashboard()}
                  >
                    Refresh
                  </button>
                </div>
                {acceptedQuotes.length === 0 && <p>None.</p>}
                <ul>
                  {acceptedQuotes.map((q) => (
                    <li key={q.quote_id}>
                      Quote #{q.quote_id} – Client {q.username} – Price $
                      {Number(q.quoted_price).toFixed(2)} – Accepted:{' '}
                      {new Date(q.accepted_time).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h3>6. Prospective Clients (no requests)</h3>
                {prospectiveClients.length === 0 && <p>None.</p>}
                <ul>
                  {prospectiveClients.map((c) => (
                    <li key={c.client_id}>
                      {c.first_name} {c.last_name} ({c.username}) – {c.email}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h3>7. Largest Job (by rooms, completed)</h3>
                {largestJobs.length === 0 && <p>None.</p>}
                <ul>
                  {largestJobs.map((r) => (
                    <li key={r.request_id}>
                      {r.first_name} {r.last_name} ({r.username}) –{' '}
                      {r.number_of_rooms} rooms at {r.service_address}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h3>8. Overdue Bills (unpaid &gt; 7 days)</h3>
                {overdueBills.length === 0 && <p>None.</p>}
                <ul>
                  {overdueBills.map((b) => (
                    <li key={b.bill_id}>
                      Bill #{b.bill_id} – {b.first_name} {b.last_name} ({b.username}) – $
                      {Number(b.amount).toFixed(2)} – Created:{' '}
                      {new Date(b.created_at).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h3>9. Bad Clients (have overdue bills)</h3>
                {badClients.length === 0 && <p>None.</p>}
                <ul>
                  {badClients.map((c) => (
                    <li key={c.client_id}>
                      {c.first_name} {c.last_name} ({c.username})
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h3>10. Good Clients (always paid within 24 hours)</h3>
                {goodClients.length === 0 && <p>None.</p>}
                <ul>
                  {goodClients.map((c) => (
                    <li key={c.client_id}>
                      {c.first_name} {c.last_name} ({c.username})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
