const redis = require('redis');
const axios = require('axios');

const client = redis.createClient({
    socket: {
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
    }
});

client.on('error', (err) => {
    console.error('Redis connection error:', err);
});

(async () => {
    try {
        await client.connect();
        console.log('Connected to Redis');
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
    }
})();

const checkRedisHealth = async () => {
    try {
        await client.ping();
        return true;
    } catch {
        return false;
    }
};

module.exports = async (req, res, next) => {
    // Set CORS headers first
    



    // Skip middleware for OPTIONS requests
   

    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    console.log("Token", token);

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        // Cache check with health verification
        let userData;
        if (await checkRedisHealth()) {
            const cachedUser = await client.get(token);
            if (cachedUser) {
                userData = JSON.parse(cachedUser);
            }
        }

        if (!userData) {
            // Verify with external API using axios
            const response = await axios.get("https://sso.trustlinkmm.com/api/verify-token", {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    
                },
                withCredentials: true
            });

            userData = response.data.user;
            console.log("userData", userData);
            console.log("Response", response.data);
            
            // Cache with error handling
            if (await checkRedisHealth()) {
                await client.setEx(token, 3600, JSON.stringify(userData));
            }
        }

        req.user = userData;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        const status = error.response?.status || 500;
        const message = error.response?.data?.error || 'Internal server error';
        return res.status(status).json({ error: message });
    }
};

