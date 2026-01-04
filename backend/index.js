require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Register Route
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
            [username, hashedPassword]
        );
        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ message: 'User registered successfully', token });
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(409).send('Username already exists');
        }
        console.error('Error during registration:', error);
        res.status(500).send('Server error');
    }
});

// Login Route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    try {
        const result = await pool.query(
            'SELECT id, username, password_hash FROM users WHERE username = $1',
            [username]
        );
        const user = result.rows[0];
        if (!user) {
            return res.status(400).send('Invalid credentials');
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).send('Invalid credentials');
        }

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Logged in successfully', token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Server error');
    }
});

// Protected route example
app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: `Welcome ${req.user.username}, you have access to protected data!` });
});

// Pay Periods Routes
app.post('/pay-periods', authenticateToken, async (req, res) => {
    const { amount, frequency, start_date, end_date } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO pay_periods (user_id, amount, frequency, start_date, end_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.id, amount, frequency, start_date, end_date]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating pay period:', error);
        res.status(500).send('Server error');
    }
});

app.get('/pay-periods', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM pay_periods WHERE user_id = $1 ORDER BY start_date DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching pay periods:', error);
        res.status(500).send('Server error');
    }
});

app.put('/pay-periods/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { amount, frequency, start_date, end_date } = req.body;
    try {
        const result = await pool.query(
            'UPDATE pay_periods SET amount = $1, frequency = $2, start_date = $3, end_date = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 AND user_id = $6 RETURNING *',
            [amount, frequency, start_date, end_date, id, req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).send('Pay period not found or unauthorized');
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating pay period:', error);
        res.status(500).send('Server error');
    }
});

app.delete('/pay-periods/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'DELETE FROM pay_periods WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).send('Pay period not found or unauthorized');
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting pay period:', error);
        res.status(500).send('Server error');
    }
});

// Expenses Routes
app.post('/expenses', authenticateToken, async (req, res) => {
    const { name, amount, frequency, due_date } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO expenses (user_id, name, amount, frequency, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.id, name, amount, frequency, due_date]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating expense:', error);
        res.status(500).send('Server error');
    }
});

app.get('/expenses', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM expenses WHERE user_id = $1 ORDER BY name',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).send('Server error');
    }
});

app.put('/expenses/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, amount, frequency, due_date } = req.body;
    try {
        const result = await pool.query(
            'UPDATE expenses SET name = $1, amount = $2, frequency = $3, due_date = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 AND user_id = $6 RETURNING *',
            [name, amount, frequency, due_date, id, req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).send('Expense not found or unauthorized');
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).send('Server error');
    }
});

app.delete('/expenses/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).send('Expense not found or unauthorized');
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).send('Server error');
    }
});

// Accounts Routes
app.post('/accounts', authenticateToken, async (req, res) => {
    const { name, balance } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO accounts (user_id, name, balance) VALUES ($1, $2, $3) RETURNING *',
            [req.user.id, name, balance]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).send('Server error');
    }
});

app.get('/accounts', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM accounts WHERE user_id = $1 ORDER BY name',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).send('Server error');
    }
});

app.put('/accounts/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, balance } = req.body;
    try {
        const result = await pool.query(
            'UPDATE accounts SET name = $1, balance = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *',
            [name, balance, id, req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).send('Account not found or unauthorized');
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating account:', error);
        res.status(500).send('Server error');
    }
});

app.delete('/accounts/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'DELETE FROM accounts WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).send('Account not found or unauthorized');
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).send('Server error');
    }
});

// Debts Routes
app.post('/debts', authenticateToken, async (req, res) => {
    const { name, amount_owed, min_payment } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO debts (user_id, name, amount_owed, min_payment) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.id, name, amount_owed, min_payment]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating debt:', error);
        res.status(500).send('Server error');
    }
});

app.get('/debts', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM debts WHERE user_id = $1 ORDER BY name',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching debts:', error);
        res.status(500).send('Server error');
    }
});

app.put('/debts/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, amount_owed, min_payment } = req.body;
    try {
        const result = await pool.query(
            'UPDATE debts SET name = $1, amount_owed = $2, min_payment = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND user_id = $5 RETURNING *',
            [name, amount_owed, min_payment, id, req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).send('Debt not found or unauthorized');
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating debt:', error);
        res.status(500).send('Server error');
    }
});

app.delete('/debts/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'DELETE FROM debts WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).send('Debt not found or unauthorized');
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting debt:', error);
        res.status(500).send('Server error');
    }
});

app.get('/', (req, res) => {
    res.send('Money Tracker Backend is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

