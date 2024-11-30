$(document).ready(function () {
    const API_BASE_URL = "/api";

    // Function to load tokens from localStorage
    function getAccessToken() {
        return localStorage.getItem("accessToken");
    }

    // Ensure the access token is included in the Authorization header
    $.ajaxSetup({
        beforeSend: function (xhr) {
            const accessToken = getAccessToken();
            if (accessToken) {
                xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
            }
        },
    });

    function getRefreshToken() {
        return localStorage.getItem("refreshToken");
    }

    // Function to save tokens to localStorage
    function saveTokens(accessToken, refreshToken) {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
    }

    // Function to clear tokens from localStorage
    function clearTokens() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
    }

    // Function to refresh access token
    function refreshAccessToken() {
        const refreshToken = getRefreshToken();
        if (!refreshToken) return false;

        $.ajax({
            url: `${API_BASE_URL}/token/refresh/`,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ refresh: refreshToken }),
            success: function (data) {
                saveTokens(data.access, refreshToken); // Update access token
            },
            error: function () {
                clearTokens();
                loadPage("login");
            },
        });
    }

    // Function to load pages dynamically
    function loadPage(page) {
        switch (page) {
            case "main":
                $("#app").html(`
                    <div class="search-container">
                        <h1>Find Opportunities</h1>
                        <input type="text" id="searchKeyword" placeholder="Search by keyword" />
    
                        <select id="areasOfWork" multiple></select>
                        <select id="positionTypes" multiple></select>
    
                        <button id="searchButton">Search</button>
                    </div>
                    <div id="searchResults"></div>
                `);

                populateDropdowns();
                break;

            case "register":
                $("#app").html(`
                    <h1>Register</h1>
                    <form id="registerForm">
                        <input type="email" id="email" placeholder="Email" required />
                        <input type="password" id="password" placeholder="Password" required />
                        <button type="submit">Register</button>
                    </form>
                    <p id="message"></p>
                `);
                break;

            case "login":
                $("#app").html(`
                    <h1>Login</h1>
                    <form id="loginForm">
                        <input type="email" id="email" placeholder="Email" required />
                        <input type="password" id="password" placeholder="Password" required />
                        <button type="submit">Login</button>
                    </form>
                    <p id="message"></p>
                `);
                break;

            default:
                $("#app").html(`
                    <h1>Welcome</h1>
                    <p>Please register or login to continue.</p>
                `);
        }
    }


    // Function to handle user registration
    function registerUser(email, password) {
        $.ajax({
            url: `${API_BASE_URL}/register/`,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ email, password }),
            success: function () {
                $("#message").text("Registration successful! Please login.");
            },
            error: function (xhr) {
                $("#message").text(`Error: ${xhr.responseJSON.detail || "Unable to register."}`);
            },
        });
    }

    // Function to handle user login
    function loginUser(email, password) {
        $.ajax({
            url: `${API_BASE_URL}/login/`,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ email, password }),
            success: function (data) {
                saveTokens(data.access, data.refresh);
                loadPage("dashboard");
            },
            error: function () {
                $("#message").text("Login failed! Please check your credentials.");
            },
        });
    }

    // Function to handle logout
    function logoutUser() {
        clearTokens();
        loadPage("login");
    }

    // Handle navigation clicks
    $("nav a").on("click", function (e) {
        e.preventDefault();
        const page = $(this).data("page");
        loadPage(page);
    });

    // Handle form submissions
    $(document).on("submit", "#registerForm", function (e) {
        e.preventDefault();
        const email = $("#email").val();
        const password = $("#password").val();
        registerUser(email, password);
    });

    $(document).on("submit", "#loginForm", function (e) {
        e.preventDefault();
        const email = $("#email").val();
        const password = $("#password").val();
        loginUser(email, password);
    });

    $(document).on("click", "#logout", function () {
        logoutUser();
    });

    // Auto-refresh access token if needed
    setInterval(() => {
        refreshAccessToken();
    }, 4 * 60 * 1000); // Refresh every 4 minutes (based on a 5-minute expiry)

    // Load the initial page
    loadPage("welcome");

    function populateDropdowns() {

        // Populate Areas of Work
        $.ajax({
            url: `${API_BASE_URL}/areas-of-work/`,
            method: "GET",
            success: function (data) {
                const areasDropdown = $("#areasOfWork");
                data.forEach((area) => {
                    areasDropdown.append(
                        `<option value="${area.id}">${area.name}</option>`
                    );
                });
            },
            error: function () {
                console.error("Failed to fetch areas of work.");
            },
        });

        // Populate Position Types
        $.ajax({
            url: `${API_BASE_URL}/position-types/`,
            method: "GET",
            success: function (data) {
                const positionsDropdown = $("#positionTypes");
                data.forEach((position) => {
                    positionsDropdown.append(
                        `<option value="${position.id}">${position.name}</option>`
                    );
                });
            },
            error: function () {
                console.error("Failed to fetch position types.");
            },
        });
    }

    $(document).on("click", "#searchButton", function () {
        const keyword = $("#searchKeyword").val();
        const areasOfWork = $("#areasOfWork").val(); // Returns an array of selected values
        const positionTypes = $("#positionTypes").val(); // Returns an array of selected values

        // Build query parameters
        const params = new URLSearchParams({
            keyword: keyword || "", // Add keyword if not empty
        });

        // Append areas of work
        if (areasOfWork) {
            areasOfWork.forEach((area) => params.append("areas_of_work", area));
        }

        // Append position types
        if (positionTypes) {
            positionTypes.forEach((type) => params.append("position_types", type));
        }

        // Perform the search
        $.ajax({
            url: `${API_BASE_URL}/search/?${params.toString()}`,
            method: "GET",
            success: function (results) {
                displaySearchResults(results);
            },
            error: function () {
                $("#searchResults").html("<p>Error performing search.</p>");
            },
        });
    });

    function displaySearchResults(results) {
        const resultsContainer = $("#searchResults");
        resultsContainer.empty();

        if (results.length === 0) {
            resultsContainer.html("<p>No results found.</p>");
            return;
        }

        results.forEach((result) => {
            resultsContainer.append(`
                <div class="result-item">
                    <h3>${result.title}</h3>
                    <p><strong>Position Type:</strong> ${result.position_type}</p>
                    <p><strong>Area of Work:</strong> ${result.area_of_work}</p>
                    <p><strong>Application Dates:</strong> ${result.application_start_date} to ${result.application_end_date}</p>
                </div>
            `);
        });
    }

});
