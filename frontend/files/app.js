$(document).ready(function () {
    const API_BASE_URL = "/api";
    const path = window.location.pathname; // Get the current path
    const jobId = path.split("/")[1]

    // Ensure the access token is included in the Authorization header and handle 401
    $.ajaxSetup({
        beforeSend: function (xhr) {
            const accessToken = getAccessToken();
            if (accessToken) {
                xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
            }
        },
        error: function (xhr) {
            if (xhr.status === 401) {
                clearTokens();
                loadPage("login");
                $("#message").text("Your session has expired. Please log in again.");
            }
        },
    });

    loadNavbar();
    function checkAuthentication(onSuccess, onFailure) {
        $.ajax({
            url:`${API_BASE_URL}/getme/`,
            method: "GET",
            success: function (data) {
                onSuccess(data); // Call the success callback with user data
            },
            error: function (xhr) {
                if (xhr.status === 401) {
                    clearTokens(); // Clear any invalid tokens
                    if (onFailure) onFailure(); // Call the failure callback
                }
            },
        });
    }

    function loadNavbar() {
        checkAuthentication((userData) => {
            const emailDropdown = `
                <div class="user-menu">
                    <button id="userEmail" class="dropdown-toggle">${userData.email}</button>
                    <div class="dropdown-menu">
                        <a href="#" id="logoutLink">Logout</a>
                    </div>
                </div>
            `;

            $("#navbar").html(`
                <nav>
                    <a href="#" data-page="main">Home</a>
                    <a href="#" data-page="browseJobs">Browse Jobs</a>
                    <a href="#" data-page="postJobs" id="postJobsLink">Post Jobs</a>
                    ${emailDropdown}
                </nav>
            `);

            // Attach event handlers
            attachNavbarEventHandlers();
        }, () => {
            // Load navbar without user details if not authenticated
            $("#navbar").html(`
                <nav>
                    <a href="#" data-page="main">Home</a>
                    <a href="#" data-page="browseJobs">Browse Jobs</a>
                    <a href="#" data-page="login">Login</a>
                    <a href="#" data-page="register">Register</a>
                </nav>
            `);

            // Attach event handlers
            attachNavbarEventHandlers();
        });
    }

    function attachNavbarEventHandlers() {
        // Handle page navigation
        $("nav a").on("click", function (e) {
            e.preventDefault();
            const page = $(this).data("page");
            loadPage(page);
        });

        // Handle dropdown toggle
        $(document).on("click", "#userEmail", function () {
            $(".dropdown-menu").toggle(); // Toggle visibility of the dropdown menu
        });

        // Handle logout
        $(document).on("click", "#logoutLink", function (e) {
            e.preventDefault();
            clearTokens();
            loadNavbar(); // Refresh the navbar
            loadPage("login"); // Redirect to login page
        });
    }


    // Function to load tokens from localStorage
    function getAccessToken() {
        return localStorage.getItem("accessToken");
    }

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
        const isAuthenticated = Boolean(getAccessToken()); // Check if the user is authenticated

        // Prevent authenticated users from accessing login and registration pages
        if (isAuthenticated && (page === "login" || page === "register")) {
            loadPage("main"); // Redirect to the main page if already authenticated
            return;
        }

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
                    <!-- Results Section -->
                    <div id="searchResultsContainer" class="results-container" style="display: none;">
                        <div id="jobList" class="job-list">
                            <!-- Sidebar with job cards -->
                        </div>
                        <div id="jobDetails" class="job-details">
                            <h2>Select a job to view details</h2>
                        </div>
                    </div>
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
            case "browseJobs":
                $("#app").html(`
                    <div class="browse-jobs">
                        <div id="jobList" class="job-list">
                            <!-- Compact job cards will appear here -->
                        </div>
                        <div id="jobDetails" class="job-details">
                            <h2>Select a job to view details</h2>
                        </div>
                    </div>
                `);
                fetchJobPostings(1); // Load the first page of job postings
                break;

            case "postJobs":
                // Check if user is authenticated
                checkAuthentication(() => {
                    $("#app").html(`
                        <form id="postJobForm">
                            <h1>Post a Job</h1>
        
                            <!-- Title -->
                            <label for="title">Title</label>
                            <input type="text" id="title" name="title" required />
        
                            <!-- Position Type -->
                            <label for="positionType">Position Type</label>
                            <select id="positionType" name="positionType" required></select>
        
                            <!-- Areas of Work -->
                            <label for="areasOfWork">Areas of Work</label>
                            <select id="areasOfWork" name="areasOfWork" multiple required></select>
        
                            <!-- Application Dates -->
                            <label for="applicationStartDate">Application Start Date</label>
                            <input type="text" id="applicationStartDate" name="applicationStartDate" required />
        
                            <label for="applicationEndDate">Application End Date</label>
                            <input type="text" id="applicationEndDate" name="applicationEndDate" required />
        
                            <!-- WYSIWYG Fields -->
                            <label for="employerDescription">Employer Description</label>
                            <textarea id="employerDescription" name="employerDescription"></textarea>
        
                            <label for="vacancyDescription">Vacancy Description</label>
                            <textarea id="vacancyDescription" name="vacancyDescription"></textarea>
        
                            <label for="applicationSteps">Application Steps</label>
                            <textarea id="applicationSteps" name="applicationSteps"></textarea>
        
                            <!-- Custom Fields -->
                            <div id="customFieldsContainer"></div>
                            <button type="button" id="addCustomField">Add Custom Field</button>
        
                            <!-- Submit -->
                            <button type="submit">Post Job</button>
                        </form>
                    `);
                    populatePositionTypes();
                    populateAreasOfWork();
                    initializeDatePickers();
                    initializeWYSIWYGEditors();
                    attachCustomFieldHandler();
                    function populatePositionTypes() {
                        $.ajax({
                            url: `${API_BASE_URL}/position-types/`,
                            method: "GET",
                            success: function (data) {
                                const positionTypeDropdown = $("#positionType");
                                data.forEach((type) => {
                                    positionTypeDropdown.append(`<option value="${type.id}">${type.name}</option>`);
                                });
                            },
                            error: function () {
                                console.error("Failed to load position types.");
                            },
                        });
                        }

                        function populateAreasOfWork() {
                            $.ajax({
                                url: `${API_BASE_URL}/areas-of-work/`,
                                method: "GET",
                                success: function (data) {
                                    const areasOfWorkDropdown = $("#areasOfWork");
                                    data.forEach((area) => {
                                        areasOfWorkDropdown.append(`<option value="${area.id}">${area.name}</option>`);
                                    });
                                },
                                error: function () {
                                    console.error("Failed to load areas of work.");
                                },
                            });
                        }
                        function initializeDatePickers() {
                            $("#applicationStartDate, #applicationEndDate").datepicker({
                                dateFormat: "yy-mm-dd", // Match expected backend format
                            });
                        }

                        function initializeWYSIWYGEditors() {
                            ["#employerDescription", "#vacancyDescription", "#applicationSteps"].forEach((selector) => {
                                $(selector).ckeditor();

                            });
                        }

                        function attachCustomFieldHandler() {
                            $("#addCustomField").on("click", function () {
                                const customFieldsContainer = $("#customFieldsContainer");
                                const fieldId = Date.now(); // Unique ID for each custom field

                                customFieldsContainer.append(`
                                    <div class="custom-field" data-id="${fieldId}">
                                        <label for="customField${fieldId}">Custom Field</label>
                                        <select class="customFieldType" data-id="${fieldId}">
                                            <option value="wysiwyg">WYSIWYG</option>
                                            <option value="file">File Upload</option>
                                        </select>
                                        <div class="customFieldContent" id="customFieldContent${fieldId}"></div>
                                        <button type="button" class="removeCustomField" data-id="${fieldId}">Remove</button>
                                    </div>
                                `);

                                attachCustomFieldTypeHandler(fieldId);
                            });
                        }

                        function attachCustomFieldTypeHandler(fieldId) {
                            $(`.customFieldType[data-id=${fieldId}]`).on("change", function () {
                                const type = $(this).val();
                                const contentContainer = $(`#customFieldContent${fieldId}`);

                                if (type === "wysiwyg") {
                                    contentContainer.html(`<textarea id="wysiwyg${fieldId}"></textarea>`);
                                    $(`#wysiwyg${fieldId}`).ckeditor();
                                } else if (type === "file") {
                                    contentContainer.html(`<input type="file" id="file${fieldId}" />`);
                                }
                            });

                            $(`.removeCustomField[data-id=${fieldId}]`).on("click", function () {
                                $(`.custom-field[data-id=${fieldId}]`).remove();
                            });
                        }


                },
                    () => {
                    loadPage("login");
                    }
                );
                break;

            default:
                loadPage("main");
        }
    }

    function displayJobCards(postings) {
        const jobListContainer = $("#jobList");
        jobListContainer.empty();

        if (postings.length === 0) {
            jobListContainer.html("<p>No job postings found.</p>");
            return;
        }

        postings.forEach((posting) => {
            jobListContainer.append(`
                <div class="job-card" data-id="${posting.id}">
                    <h4>${posting.title}</h4>
                    <p><strong>Position Type:</strong> ${posting.position_type}</p>
                    <p><strong>Areas:</strong> ${posting.area_of_work.join(", ")}</p>
                </div>
            `);
        });

        // Attach click event to load job details
        $(".job-card").on("click", function () {
            const jobId = $(this).data("id");
            fetchJobDetails(jobId);
        });
    }

    function fetchJobPostings(pageNumber) {

        $.ajax({
            url: `${API_BASE_URL}/postings/`,
            method: "GET",
            data: { page: pageNumber, page_size: 10 },
            success: function (data) {
                displayJobCards(data.results);
                updatePaginationControls(data);
            },
            error: function () {
                $("#jobPostings").html("<p>Failed to load job postings. Please try again later.</p>");
            },
        });
    }

    function updatePaginationControls(data) {
        const paginationControls = $("#paginationControls");
        paginationControls.empty();

        // Previous Page Button
        if (data.previous) {
            paginationControls.append(
                `<button class="pagination-button" data-page="${data.current_page - 1}">Previous</button>`
            );
        }

        // Page Numbers
        for (let i = 1; i <= data.total_pages; i++) {
            paginationControls.append(
                `<button class="pagination-button ${
                    i === data.current_page ? "active" : ""
                }" data-page="${i}">${i}</button>`
            );
        }

        // Next Page Button
        if (data.next) {
            paginationControls.append(
                `<button class="pagination-button" data-page="${data.current_page + 1}">Next</button>`
            );
        }

        // Attach click event to pagination buttons
        $(".pagination-button").on("click", function () {
            const page = $(this).data("page");
            fetchJobPostings(page);
        });
    }

    function fetchJobDetails(jobId) {

        $.ajax({
            url: `${API_BASE_URL}/postings/${jobId}/`,
            method: "GET",
            success: function (job) {
                displayJobDetails(job);
            },
            error: function () {
                $("#jobDetails").html("<p>Failed to load job details. Please try again later.</p>");
            },
        });
    }

    function fetchEncJobDetails(jobId) {

        $.ajax({
            url: `${API_BASE_URL}/load-post/${jobId}/`,
            method: "GET",
            success: function (job) {
                displayEncJobDetails(job);
            },
            error: function () {
                $("#app").html("<p>Failed to load job details. Please try again later.</p>");
            },
        });
    }

    function displayEncJobDetails(job) {
    const customFields = job.custom_fields
        .map(
            (field) =>
                `<p><strong>${field.field_name}:</strong> ${
                    field.field_content.startsWith("/media/")
                        ? `<a href="${field.field_content}" target="_blank">Download File</a>`
                        : field.field_content
                }</p>`
        )
        .join("");

    $("#app").html(`
        <div class="job-details">
            <h2>${job.title}</h2>
            <p><strong>Position Type:</strong> ${job.position_type}</p>
            <p><strong>Areas of Work:</strong> ${job.area_of_work.join(", ")}</p>
            <p><strong>Application Dates:</strong> ${job.application_start_date} to ${job.application_end_date}</p>
            <div><strong>Employer Description:</strong> ${job.employer_description}</div>
            <div><strong>Vacancy Description:</strong> ${job.vacancy_description}</div>
            <div><strong>Application Steps:</strong> ${job.application_steps}</div>
            <div><strong>Custom Fields:</strong> ${customFields}</div>
            <p><strong>Date Posted:</strong> ${job.date_posted}</p>
        </div>
    `);
}


    function displayJobDetails(job) {
        const customFields = job.custom_fields
            .map(
                (field) =>
                    `<p><strong>${field.field_name}:</strong> ${
                        field.field_content.startsWith("/media/")
                            ? `<a href="${field.field_content}" target="_blank">Download File</a>`
                            : field.field_content
                    }</p>`
            )
            .join("");

        $("#jobDetails").html(`
            <h2>${job.title}</h2>
            <p><strong>Position Type:</strong> ${job.position_type}</p>
            <p><strong>Areas of Work:</strong> ${job.area_of_work.join(", ")}</p>
            <p><strong>Application Dates:</strong> ${job.application_start_date} to ${job.application_end_date}</p>
            <div><strong>Employer Description:</strong> ${job.employer_description}</div>
            <div><strong>Vacancy Description:</strong> ${job.vacancy_description}</div>
            <div><strong>Application Steps:</strong> ${job.application_steps}</div>
            <div><strong>Custom Fields:</strong> ${customFields}</div>
            <p><strong>Date Posted:</strong> ${job.date_posted}</p>
            <p><strong>Last Modified:</strong> ${job.date_last_modified}</p>
        `);
    }

    // Function to handle user registration
    function registerUser(email, password) {
        $.ajax({
            url: `${API_BASE_URL}/register/`,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ email, password }),
            success: function () {
                loadPage("login");
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
                loadPage("postJobs");
                loadNavbar();
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
    if (jobId) {
        fetchEncJobDetails(jobId); // Fetch and display job details for the extracted ID
    } else {
        loadPage("main"); // Load the default main page if no ID is present
    }

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
                $("#searchResultsContainer").hide();
                alert("Error performing search.");
            },
        });
    });

    function showSubscribeModal() {
    // Create the modal HTML
    const modalHtml = `
        <div id="subscribeModal" class="modal">
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Subscribe to this Search</h2>
                <p>To subscribe to this search, enter your email address:</p>
                <input type="email" id="subscribeEmail" placeholder="Enter your email" required />
                <button id="confirmSubscribeButton">Subscribe</button>
            </div>
        </div>
    `;

    // Append modal to the body and display it
    $("body").append(modalHtml);
    $(".modal").fadeIn();

    // Close modal on clicking the close button
    $(".close").on("click", function () {
        $("#subscribeModal").remove();
    });

    // Handle subscribe button click
    $("#confirmSubscribeButton").on("click", function () {
        handleSubscription();
    });
}

function handleSubscription() {
    const email = $("#subscribeEmail").val();
    if (!email) {
        alert("Please enter a valid email address.");
        return;
    }

    // Collect search parameters
    const keyword = $("#searchKeyword").val();
    const positionTypes = $("#positionTypes").val();
    const areasOfWork = $("#areasOfWork").val();

    // Prepare data for the subscription
    const subscriptionData = {
        email: email,
        keyword: keyword || "",
        position_types: positionTypes || [],
        areas_of_work: areasOfWork || [],
    };

    // Send POST request
    $.ajax({
        url: "/api/subscribe/",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(subscriptionData),
        success: function () {
            alert("You have successfully subscribed to this search.");
            $("#subscribeModal").remove(); // Close modal
        },
        error: function () {
            alert("Failed to subscribe. Please try again later.");
        },
    });
}


    function displaySearchResults(results) {
        const resultsContainer = $("#searchResultsContainer");
        const jobListContainer = $("#jobList");
        const subscribeSectionId = "subscribeSection";

        // Show results container
        resultsContainer.show();
        jobListContainer.empty();

        if (results.length === 0) {
            jobListContainer.html("<p>No results found.</p>");
        } else {
        results.forEach((result) => {
            jobListContainer.append(`
                <div class="job-card" data-id="${result.id}">
                    <h4>${result.title}</h4>
                    <p><strong>Position Type:</strong> ${result.position_type}</p>
                    <p><strong>Areas:</strong> ${result.area_of_work.join(", ")}</p>
                </div>
            `);
        });

        // Attach click event to load job details
        $(".job-card").on("click", function () {
            const jobId = $(this).data("id");
            fetchJobDetails(jobId);
        });
        }

        // Ensure the Subscribe section is added only once
        if (!$(`#${subscribeSectionId}`).length) {
            resultsContainer.append(`
                <div id="${subscribeSectionId}">
                    <button id="subscribeButton">Subscribe to this Search</button>
                </div>
            `);

            // Attach click event to the subscribe button
            $("#subscribeButton").on("click", function () {
                showSubscribeModal();
            });
        }
    }

    $(document).on("submit", "#postJobForm", function (e) {
        e.preventDefault();

        const formData = {
            title: $("#title").val(),
            position_type: $("#positionType").val(),
            area_of_work: $("#areasOfWork").val(),
            application_start_date: $("#applicationStartDate").val(),
            application_end_date: $("#applicationEndDate").val(),
            employer_description: $("#employerDescription").val(),
            vacancy_description: $("#vacancyDescription").val(),
            application_steps: $("#applicationSteps").val(),
            custom_fields: [],
        };

        // Process custom fields
        $(".custom-field").each(function () {
            const fieldId = $(this).data("id");
            const type = $(`.customFieldType[data-id=${fieldId}]`).val();
            const content =
                type === "wysiwyg"
                    ? $(`#wysiwyg${fieldId}`).val()
                    : $(`#file${fieldId}`)[0].files[0]; // File object

            formData.custom_fields.push({
                field_type: type,
                field_content: content,
            });
        });

        submitJobPosting(formData);
    });

    function submitJobPosting(data) {
        const formData = new FormData();

        // Add standard fields
        for (const key in data) {
            if (key === "custom_fields") continue;
            formData.append(key, data[key]);
        }

        // Handle custom fields
        data.custom_fields.forEach((field, index) => {
            if (field.field_type === "file") {
                formData.append(`custom_fields[${index}][content]`, field.field_content);
            } else {
                formData.append(`custom_fields[${index}][content]`, field.field_content);
            }
            formData.append(`custom_fields[${index}][type]`, field.field_type);
        });

        $.ajax({
            url: "/api/post-a-job/",
            method: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function () {
                alert("Job posted successfully!");
                loadPage("browseJobs");
            },
            error: function () {
                alert("Failed to post job. Please try again.");
            },
        });
    }

});
