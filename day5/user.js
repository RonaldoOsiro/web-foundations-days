document.addEventListener('DOMContentLoaded', () => {
    const loadButton = document.getElementById('load-users');
    const filterInput = document.getElementById('filter-input');
    const statusP = document.getElementById('status');
    const usersList = document.getElementById('users-list');

    let allUsers = [];

    // Async function to fetch and load users
    async function loadUsers() {
        loadButton.disabled = true;
        statusP.textContent = 'Loading users...';
        usersList.innerHTML = '';
        filterInput.value = '';

        try {
            // To test the error path, temporarily change the URL below:
            // e.g., 'https://jsonplaceholder.typicode.com/users-error'
            const response = await fetch('https://jsonplaceholder.typicode.com/users');

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            allUsers = await response.json();
            statusP.textContent = `Successfully loaded ${allUsers.length} users.`;
            renderUsers(allUsers);
        } catch (error) {
            statusP.textContent = `Error loading users: ${error.message}`;
            allUsers = [];
        } finally {
            loadButton.disabled = false;
        }
    }

    // Render users array into the DOM using createElement and textContent
    function renderUsers(list) {
        usersList.innerHTML = '';

        if (list.length === 0) {
            statusP.textContent = 'No users match your filter.';
            return;
        }

        list.forEach(user => {
            const li = document.createElement('li');

            const nameEl = document.createElement('strong');
            nameEl.textContent = user.name;

            const detailsEl = document.createElement('span');
            detailsEl.textContent = ` — Email: ${user.email} | City: ${user.address.city} | Company: ${user.company.name}`;

            li.appendChild(nameEl);
            li.appendChild(detailsEl);
            usersList.appendChild(li);
        });
    }

    // Filter input event listener (client-side filtering without new requests)
    filterInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filteredUsers = allUsers.filter(user =>
            user.name.toLowerCase().includes(query)
        );

        renderUsers(filteredUsers);

        if (filteredUsers.length > 0 && allUsers.length > 0) {
            statusP.textContent = `Showing ${filteredUsers.length} of ${allUsers.length} users.`;
        }
    });

    loadButton.addEventListener('click', loadUsers);
});