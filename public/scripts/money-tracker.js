const API_BASE_URL = 'http://localhost:3000'; // Assuming backend runs on port 3000

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const authSection = document.getElementById('auth-section');
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const showLoginLink = document.getElementById('show-login');
    const showRegisterLink = document.getElementById('show-register');
    const registerButton = document.getElementById('register-button');
    const loginButton = document.getElementById('login-button');
    const registerUsernameInput = document.getElementById('register-username');
    const registerPasswordInput = document.getElementById('register-password');
    const registerMessage = document.getElementById('register-message');
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const loginMessage = document.getElementById('login-message');

    const dashboard = document.getElementById('money-tracker-dashboard');
    const dashboardUsername = document.getElementById('dashboard-username');
    const logoutButton = document.getElementById('logout-button');

    const addPayPeriodForm = document.getElementById('add-pay-period-form');
    const payPeriodAmountInput = document.getElementById('pay-period-amount');
    const payPeriodFrequencyInput = document.getElementById('pay-period-frequency');
    const payPeriodStartDateInput = document.getElementById('pay-period-start-date');
    const payPeriodEndDateInput = document.getElementById('pay-period-end-date');
    const payPeriodsList = document.getElementById('pay-periods-list');

    const addExpenseForm = document.getElementById('add-expense-form');
    const expenseNameInput = document.getElementById('expense-name');
    const expenseAmountInput = document.getElementById('expense-amount');
    const expenseFrequencyInput = document.getElementById('expense-frequency');
    const expenseDueDateInput = document.getElementById('expense-due-date');
    const expensesList = document.getElementById('expenses-list');

    const addAccountForm = document.getElementById('add-account-form');
    const accountNameInput = document.getElementById('account-name');
    const accountBalanceInput = document.getElementById('account-balance');
    const accountsList = document.getElementById('accounts-list');

    const addDebtForm = document.getElementById('add-debt-form');
    const debtNameInput = document.getElementById('debt-name');
    const debtAmountOwedInput = document.getElementById('debt-amount-owed');
    const debtMinPaymentInput = document.getElementById('debt-min-payment');
    const debtsList = document.getElementById('debts-list');

    const estimatedBiWeeklyPaySpan = document.getElementById('estimated-biweekly-pay');
    const monthlyPayAfterExpensesSpan = document.getElementById('monthly-pay-after-expenses');

    // Utility Functions
    const getToken = () => localStorage.getItem('jwtToken');
    const setToken = (token) => localStorage.setItem('jwtToken', token);
    const removeToken = () => localStorage.removeItem('jwtToken');

    const displayMessage = (element, message, isError = false) => {
        element.textContent = message;
        element.style.color = isError ? 'red' : 'green';
        setTimeout(() => element.textContent = '', 5000);
    };

    const fetchData = async (url, method = 'GET', body = null) => {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        };
        const options = {
            method,
            headers,
        };
        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE_URL}${url}`, options);
        if (response.status === 401 || response.status === 403) {
            // Unauthorized or Forbidden, redirect to login
            logoutUser();
            return null;
        }
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    };

    // Authentication Functions
    const showLoginForm = () => {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        loginMessage.textContent = '';
        registerMessage.textContent = '';
    };

    const showRegisterForm = () => {
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
        loginMessage.textContent = '';
        registerMessage.textContent = '';
    };

    const registerUser = async () => {
        const username = registerUsernameInput.value;
        const password = registerPasswordInput.value;
        try {
            const data = await fetchData('/register', 'POST', { username, password });
            setToken(data.token);
            displayMessage(registerMessage, data.message);
            checkAuthAndRenderDashboard();
        } catch (error) {
            displayMessage(registerMessage, 'Registration failed. ' + error.message, true);
        }
    };

    const loginUser = async () => {
        const username = loginUsernameInput.value;
        const password = loginPasswordInput.value;
        try {
            const data = await fetchData('/login', 'POST', { username, password });
            setToken(data.token);
            displayMessage(loginMessage, data.message);
            checkAuthAndRenderDashboard();
        } catch (error) {
            displayMessage(loginMessage, 'Login failed. ' + error.message, true);
        }
    };

    const logoutUser = () => {
        removeToken();
        authSection.style.display = 'block';
        dashboard.style.display = 'none';
        showLoginForm();
    };

    const checkAuthAndRenderDashboard = () => {
        if (getToken()) {
            authSection.style.display = 'none';
            dashboard.style.display = 'block';
            const payload = JSON.parse(atob(getToken().split('.')[1]));
            dashboardUsername.textContent = payload.username;
            renderDashboardData();
        } else {
            logoutUser();
        }
    };

    // Dashboard Data Rendering and Calculation
    const renderDashboardData = async () => {
        await Promise.all([
            renderPayPeriods(),
            renderExpenses(),
            renderAccounts(),
            renderDebts()
        ]);
        calculateSummary();
    };

    const calculateSummary = async () => {
        // Estimated Bi-Weekly Pay (Static for now, will be dynamic from user input)
        const biWeeklyPay = parseFloat(estimatedBiWeeklyPaySpan.textContent) || 0;

        // Monthly Pay After Expenses
        let totalMonthlyExpenses = 0;
        const expenses = await fetchData('/expenses'); // Fetch current expenses
        if (expenses) {
            expenses.forEach(exp => {
                if (exp.frequency === 'monthly') {
                    totalMonthlyExpenses += parseFloat(exp.amount);
                } else if (exp.frequency === 'yearly') {
                    totalMonthlyExpenses += parseFloat(exp.amount) / 12;
                }
            });
        }
        
        const monthlyPay = biWeeklyPay * 2; // Rough estimation for monthly from bi-weekly
        const monthlyPayAfterExpenses = monthlyPay - totalMonthlyExpenses;
        monthlyPayAfterExpensesSpan.textContent = monthlyPayAfterExpenses.toFixed(2);
    };

    // Render Functions for each section
    const renderPayPeriods = async () => {
        payPeriodsList.innerHTML = '';
        const payPeriods = await fetchData('/pay-periods');
        if (payPeriods) {
            payPeriods.forEach(pp => {
                const div = document.createElement('div');
                div.innerHTML = `
                    <p>Amount: $${pp.amount} | Frequency: ${pp.frequency} | ${pp.start_date.split('T')[0]} to ${pp.end_date.split('T')[0]}</p>
                    <button class="edit-btn" data-id="${pp.id}" data-type="pay-period">Edit</button>
                    <button class="delete-btn" data-id="${pp.id}" data-type="pay-period">Delete</button>
                `;
                payPeriodsList.appendChild(div);
            });
        }
    };

    const renderExpenses = async () => {
        expensesList.innerHTML = '';
        const expenses = await fetchData('/expenses');
        if (expenses) {
            expenses.forEach(exp => {
                const div = document.createElement('div');
                div.innerHTML = `
                    <p>${exp.name}: $${exp.amount} | Frequency: ${exp.frequency} ${exp.due_date ? `(Due: Day ${exp.due_date})` : ''}</p>
                    <button class="edit-btn" data-id="${exp.id}" data-type="expense">Edit</button>
                    <button class="delete-btn" data-id="${exp.id}" data-type="expense">Delete</button>
                `;
                expensesList.appendChild(div);
            });
        }
    };

    const renderAccounts = async () => {
        accountsList.innerHTML = '';
        const accounts = await fetchData('/accounts');
        if (accounts) {
            accounts.forEach(acc => {
                const div = document.createElement('div');
                div.innerHTML = `
                    <p>${acc.name}: $${acc.balance}</p>
                    <button class="edit-btn" data-id="${acc.id}" data-type="account">Edit</button>
                    <button class="delete-btn" data-id="${acc.id}" data-type="account">Delete</button>
                `;
                accountsList.appendChild(div);
            });
        }
    };

    const renderDebts = async () => {
        debtsList.innerHTML = '';
        const debts = await fetchData('/debts');
        if (debts) {
            debts.forEach(debt => {
                const div = document.createElement('div');
                div.innerHTML = `
                    <p>${debt.name}: Owed $${debt.amount_owed} | Min. Payment: $${debt.min_payment || 'N/A'}</p>
                    <button class="edit-btn" data-id="${debt.id}" data-type="debt">Edit</button>
                    <button class="delete-btn" data-id="${debt.id}" data-type="debt">Delete</button>
                `;
                debtsList.appendChild(div);
            });
        }
    };

    // Event Listeners
    showLoginLink.addEventListener('click', showLoginForm);
    showRegisterLink.addEventListener('click', showRegisterForm);
    registerButton.addEventListener('click', registerUser);
    loginButton.addEventListener('click', loginUser);
    logoutButton.addEventListener('click', logoutUser);

    addPayPeriodForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = payPeriodAmountInput.value;
        const frequency = payPeriodFrequencyInput.value;
        const start_date = payPeriodStartDateInput.value;
        const end_date = payPeriodEndDateInput.value;
        await fetchData('/pay-periods', 'POST', { amount, frequency, start_date, end_date });
        addPayPeriodForm.reset();
        renderDashboardData();
    });

    payPeriodsList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn') && e.target.dataset.type === 'pay-period') {
            const id = e.target.dataset.id;
            await fetchData(`/pay-periods/${id}`, 'DELETE');
            renderDashboardData();
        }
    });

    addExpenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = expenseNameInput.value;
        const amount = expenseAmountInput.value;
        const frequency = expenseFrequencyInput.value;
        const due_date = expenseDueDateInput.value || null;
        await fetchData('/expenses', 'POST', { name, amount, frequency, due_date });
        addExpenseForm.reset();
        renderDashboardData();
    });

    expensesList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn') && e.target.dataset.type === 'expense') {
            const id = e.target.dataset.id;
            await fetchData(`/expenses/${id}`, 'DELETE');
            renderDashboardData();
        }
    });

    addAccountForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = accountNameInput.value;
        const balance = accountBalanceInput.value;
        await fetchData('/accounts', 'POST', { name, balance });
        addAccountForm.reset();
        renderDashboardData();
    });

    accountsList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn') && e.target.dataset.type === 'account') {
            const id = e.target.dataset.id;
            await fetchData(`/accounts/${id}`, 'DELETE');
            renderDashboardData();
        }
    });

    addDebtForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = debtNameInput.value;
        const amount_owed = debtAmountOwedInput.value;
        const min_payment = debtMinPaymentInput.value || null;
        await fetchData('/debts', 'POST', { name, amount_owed, min_payment });
        addDebtForm.reset();
        renderDashboardData();
    });

    debtsList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn') && e.target.dataset.type === 'debt') {
            const id = e.target.dataset.id;
            await fetchData(`/debts/${id}`, 'DELETE');
            renderDashboardData();
        }
    });


    // Initial check
    checkAuthAndRenderDashboard();
});