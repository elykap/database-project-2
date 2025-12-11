# DB Project 2
## 1. Prerequisites

- XAMPP (Apache + MySQL)
- Node.js + npm
- Browser (Chrome/Safari/etc.)

## 2. Database Setup (XAMPP / phpMyAdmin)

1. Start **Apache** and **MySQL** in XAMPP.
2. Open phpMyAdmin (e.g. http://localhost/phpmyadmin).
3. Create a database named: `cleaning_services`.
4. Import / run `sql.txt` in that database.

## 3. Backend Setup

cd backend
npm install
node server.js

Backend runs at http://localhost:3001

## 4. Frontend Setup

cd frontend
npm install
npm run dev


## 5. Using the App

Register & Login
	•	Register any normal client and log in to create service requests.
	•	Register Anna as a normal account first, and promote to admin.

## 6. Log in as Anna (Admin)

Anna can:
	•	View pending service requests and create quotes.
	•	View orders, complete them, and create bills.
	•	View dashboard analytics (frequent clients, uncommitted clients, overdue bills, etc.).

## 7. Log in as a Client

Clients can:
	•	Create cleaning service requests.
	•	View quotes, accept quotes (creates service orders).
	•	View bills, pay bills, or dispute them.

## Contributions

Worked alone on this project (no partner). Hours together: 0.
