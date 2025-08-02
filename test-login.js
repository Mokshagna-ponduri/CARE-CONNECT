const https = require('https');
const http = require('http');

const API_BASE = 'http://localhost:3001/api';

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };
        
        const req = client.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        json: () => Promise.resolve(jsonData)
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        json: () => Promise.resolve({ message: data })
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

async function testLoginFunctionality() {
    console.log('🧪 Testing Login Functionality...\n');

    try {
        // Test 1: Register a new user
        console.log('1. Registering a test user...');
        const registerResponse = await makeRequest(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Test User',
                email: 'testuser@example.com',
                password: 'password123',
                phone: '+1234567890',
                role: 'seeker'
            })
        });

        const registerResult = await registerResponse.json();
        
        if (registerResponse.ok) {
            console.log('✅ Registration successful');
            console.log('   User:', registerResult.user.name);
            console.log('   Email:', registerResult.user.email);
            
            // Test 2: Login with the created user
            console.log('\n2. Testing login...');
            const loginResponse = await makeRequest(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'testuser@example.com',
                    password: 'password123'
                })
            });

            const loginResult = await loginResponse.json();
            
            if (loginResponse.ok) {
                console.log('✅ Login successful');
                console.log('   Token received:', loginResult.token ? 'Yes' : 'No');
                console.log('   User data:', loginResult.user.name);
                
                // Test 3: Get user profile with token
                console.log('\n3. Testing profile fetch...');
                const profileResponse = await makeRequest(`${API_BASE}/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${loginResult.token}`
                    }
                });

                const profileResult = await profileResponse.json();
                
                if (profileResponse.ok) {
                    console.log('✅ Profile fetch successful');
                    console.log('   Name:', profileResult.user.name);
                    console.log('   Email:', profileResult.user.email);
                    console.log('   Role:', profileResult.user.role);
                } else {
                    console.log('❌ Profile fetch failed:', profileResult.message);
                }
                
            } else {
                console.log('❌ Login failed:', loginResult.message);
            }
            
        } else {
            console.log('❌ Registration failed:', registerResult.message);
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
    
    console.log('\n🎉 Login functionality testing completed!');
}

testLoginFunctionality(); 