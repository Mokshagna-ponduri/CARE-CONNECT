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

async function testProfileEndpoints() {
    console.log('🧪 Testing Profile API Endpoints...\n');

    try {
        // Test 1: Register a new user
        console.log('1. Testing user registration...');
        const registerResponse = await makeRequest(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Test User',
                email: 'testuser@example.com',
                password: 'password123',
                phone: '+1234567890'
            })
        });

        const registerResult = await registerResponse.json();
        
        if (registerResponse.ok) {
            console.log('✅ Registration successful');
            console.log('   Token:', registerResult.token.substring(0, 20) + '...');
            console.log('   User:', registerResult.user.name);
            
            const token = registerResult.token;
            
            // Test 2: Get user profile
            console.log('\n2. Testing get profile...');
            const profileResponse = await makeRequest(`${API_BASE}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const profileResult = await profileResponse.json();
            
            if (profileResponse.ok) {
                console.log('✅ Get profile successful');
                console.log('   Name:', profileResult.user.name);
                console.log('   Email:', profileResult.user.email);
                console.log('   Phone:', profileResult.user.phone);
                console.log('   Profile:', profileResult.user.profile);
            } else {
                console.log('❌ Get profile failed:', profileResult.message);
            }
            
            // Test 3: Update profile
            console.log('\n3. Testing profile update...');
            const updateResponse = await makeRequest(`${API_BASE}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'Updated Test User',
                    phone: '+1987654321',
                    profile: {
                        bio: 'This is my updated bio',
                        skills: ['testing', 'coding', 'helping']
                    }
                })
            });

            const updateResult = await updateResponse.json();
            
            if (updateResponse.ok) {
                console.log('✅ Profile update successful');
                console.log('   Updated name:', updateResult.user.name);
                console.log('   Updated phone:', updateResult.user.phone);
                console.log('   Updated bio:', updateResult.user.profile.bio);
                console.log('   Updated skills:', updateResult.user.profile.skills);
            } else {
                console.log('❌ Profile update failed:', updateResult.message);
            }
            
            // Test 4: Get user stats
            console.log('\n4. Testing get user stats...');
            const statsResponse = await makeRequest(`${API_BASE}/users/me/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const statsResult = await statsResponse.json();
            
            if (statsResponse.ok) {
                console.log('✅ Get stats successful');
                console.log('   Requested stats:', statsResult.stats.requested);
                console.log('   Helped stats:', statsResult.stats.helped);
                console.log('   Rating:', statsResult.stats.rating);
            } else {
                console.log('❌ Get stats failed:', statsResult.message);
            }
            
        } else {
            console.log('❌ Registration failed:', registerResult.message);
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
    
    console.log('\n🎉 Profile API testing completed!');
}

testProfileEndpoints(); 