# Talker Backend

This is the backend server for a real-time chat application built with Node.js and Socket.IO.

## Prerequisites

- Node.js
- npm
- MongoDB

## Installation

1. Clone the repository:
   
      git clone https://github.com/farooqpk/talker-backEnd.git
   

2. Navigate to the project directory:
   
      cd talker-backEnd
   

3. Install dependencies:
   
      npm install
   

4. Create a `.env` file in the root directory and add the following environment variables:
   
      PORT=your_port_number

      DATABASE_URL=your_mongodb_url

      ACCESS_TOKEN_SECRET=your_access_token_secret

      REFRESH_TOKEN_SECRET=your_refresh_token_secret

      REDIS_URL=your_redis_url

      R2_ACCOUNT_ID=your_cloudflare_r2_account_id

      R2_ACCESS_KEY=your_cloudflare_r2_access_key

      R2_SECRET_KEY=your_cloudflare_r2_secret_key

      R2_BUCKET_NAME=your_cloudflare_r2_bucket_name

      NODE_ENV='development'

      GEMINI_API_KEY=your_gemini_api_key

      CERTBOT_EMAIL=your_certbot_email

      ACCESS_TOKEN_EXPIRY=2
      
      REFRESH_TOKEN_EXPIRY=30
   

## Usage

1. Start the server:
   
      npm start
   

2. The server will be running on `http://localhost:8000` (or the port you specified in the `.env` file).

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## Contact

Linkedin - https://linkedin.com/in/ummarfarooq-pk

Live Link: [https://talker.fun](https://talker.fun)
