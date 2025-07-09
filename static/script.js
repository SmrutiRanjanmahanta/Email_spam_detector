document.addEventListener("DOMContentLoaded", () => {
    // Initialize modern cursor
    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    document.body.appendChild(cursor);

    // Smooth cursor tracking
    let cursorX = 0;
    let cursorY = 0;
    let targetX = 0;
    let targetY = 0;
    const speed = 0.1;

    document.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
    });

    document.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        targetY += scrollY;
    });

    function updateCursor() {
        cursorX += (targetX - cursorX) * speed;
        cursorY += (targetY - cursorY) * speed;
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        
        // Change cursor color on hover
        const hoverElements = document.querySelectorAll('.form-group input, .form-group textarea, .btn-primary, .auth-footer a');
        hoverElements.forEach(el => {
            if (isHovered(el, cursorX, cursorY)) {
                cursor.style.backgroundColor = el.classList.contains('btn-primary') 
                    ? 'var(--gradient-end)' 
                    : 'var(--primary-color)';
                cursor.style.transform = 'translate(-50%, -50%) scale(1.2)';
            } else {
                cursor.style.backgroundColor = 'var(--primary-color)';
                cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            }
        });

        requestAnimationFrame(updateCursor);
    }

    function isHovered(element, x, y) {
        const rect = element.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }

    // Initialize form handlers
    const spamForm = document.getElementById('spamForm');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Handle spam detection form
    if (spamForm) {
        spamForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailContent = document.querySelector('textarea[name="email_content"]').value.trim();
            if (!emailContent) {
                alert('Please enter email content');
                return;
            }
            try {
                const response = await fetch('/predict', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email_content: emailContent })
                });
                const result = await response.json();
                if (result.error) {
                    alert(result.error || 'An error occurred');
                    return;
                }
                // Update the UI with results
                const resultContainer = document.getElementById('resultContainer');
                const spamBar = document.getElementById('spamBar');
                const spamProbability = document.getElementById('spamProbability');
                const resultText = document.getElementById('resultText');
                const reasonsList = document.getElementById('reasonsList');
                const spamProbValue = document.getElementById('spamProbValue');
                const hamProbValue = document.getElementById('hamProbValue');
                if (!resultContainer) return;
                resultContainer.classList.remove('hidden');
                const spamPercent = (result.spam_probability * 100).toFixed(1);
                const hamPercent = (result.ham_probability * 100).toFixed(1);
                spamBar.style.width = `${spamPercent}%`;
                spamProbability.textContent = `${spamPercent}%`;
                resultText.textContent = `This email is ${result.result.toLowerCase()}`;
                // Clear and populate reasons list (if any)
                reasonsList.innerHTML = '';
                // Update probability values
                spamProbValue.textContent = `${spamPercent}%`;
                hamProbValue.textContent = `${hamPercent}%`;
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while checking the email. Please try again.');
            }
        });
    }

    // Handle register form
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailInput = document.querySelector('input[name="email"]');
            const passwordInput = document.querySelector('input[name="password"]');
            const confirmPasswordInput = document.querySelector('input[name="confirm_password"]');
            const errorDiv = registerForm.querySelector('.alert-danger');
            
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            // Clear previous errors
            if (errorDiv) {
                errorDiv.remove();
            }
            
            // Validate inputs
            if (!email || !password || !confirmPassword) {
                registerForm.insertAdjacentHTML('afterbegin', `
                    <div class="alert alert-danger" style="margin-bottom: 20px;">
                        <i class="fas fa-exclamation-triangle"></i> All fields are required
                    </div>
                `);
                return;
            }
            
            if (password !== confirmPassword) {
                registerForm.insertAdjacentHTML('afterbegin', `
                    <div class="alert alert-danger" style="margin-bottom: 20px;">
                        <i class="fas fa-exclamation-triangle"></i> Passwords do not match
                    </div>
                `);
                return;
            }
            
            if (password.length < 8) {
                registerForm.insertAdjacentHTML('afterbegin', `
                    <div class="alert alert-danger" style="margin-bottom: 20px;">
                        <i class="fas fa-exclamation-triangle"></i> Password must be at least 8 characters long
                    </div>
                `);
                return;
            }
            
            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        password,
                        confirm_password: confirmPassword
                    })
                });
                
                const result = await response.json();
                
                if (result.error) {
                    registerForm.insertAdjacentHTML('afterbegin', `
                        <div class="alert alert-danger" style="margin-bottom: 20px;">
                            <i class="fas fa-exclamation-triangle"></i> ${result.error}
                        </div>
                    `);
                    return;
                }
                
                if (result.success) {
                    registerForm.insertAdjacentHTML('afterbegin', `
                        <div class="alert alert-success" style="margin-bottom: 20px;">
                            <i class="fas fa-check-circle"></i> ${result.message}
                        </div>
                    `);
                    window.location.href = result.redirect;
                }
            } catch (error) {
                console.error('Registration error:', error);
                registerForm.insertAdjacentHTML('afterbegin', `
                    <div class="alert alert-danger" style="margin-bottom: 20px;">
                        <i class="fas fa-exclamation-triangle"></i> An error occurred during registration. Please try again.
                    </div>
                `);
            }
        });
    }

    updateCursor();
});