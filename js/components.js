document.addEventListener("DOMContentLoaded", () => {
    
    // This function will set up the interactivity for the navbar
    const setupNavbar = () => {
        const hamburgerBtn = document.getElementById('hamburger-btn');
        const mobileMenu = document.getElementById('mobile-menu');

        if (hamburgerBtn && mobileMenu) {
            hamburgerBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
    };

    // This function fetches and injects the HTML for a component
    const loadComponent = (componentPath, targetElementId, callback) => {
        fetch(componentPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load component: ${componentPath}`);
                }
                return response.text();
            })
            .then(data => {
                const targetElement = document.getElementById(targetElementId);
                if (targetElement) {
                    targetElement.innerHTML = data;
                    if (callback) {
                        callback(); // Run the callback function after loading the component
                    }
                } else {
                    console.error(`Target element not found: ${targetElementId}`);
                }
            })
            .catch(error => console.error(error));
    };

    // Load Navbar and pass the setupNavbar function as a callback
    loadComponent('components/navbar.html', 'navbar-container', setupNavbar);
    
    // Load Footer (no callback needed)
    loadComponent('components/footer.html', 'footer-container');
});