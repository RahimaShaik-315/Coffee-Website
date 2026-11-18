# Coffee Website ☕

## Overview
**Coffee Website** is a modern, stylish coffee ordering web application. It features a full authentication system, a responsive frontend, and a Node.js backend connected to MongoDB for persistent data storage. 

Users can sign up, log in, browse products, and place orders with a dynamic cart system.

## Features
- **User Authentication**: Signup and login using JWT and bcrypt.
- **Product Ordering**: Browse and add coffee items to a cart.
- **Cart Management**: Manage cart items before placing an order.
- **Order Storage**: Orders are stored in a MongoDB database.
- **Responsive Design**: Optimized for both desktop and mobile users.

## Installation Guide
### Prerequisites
Make sure you have the following installed:
- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [MongoDB Atlas or local MongoDB](https://www.mongodb.com/)

### Setup Instructions
1. **Download or Clone the Repository**
   ```sh
   git clone https://github.com/your-repository/CoffeeWebsite.git
   ```

2. **Navigate to the Project Directory**
   ```sh
   cd CoffeeWebsite
   ```

3. **Install Dependencies**
   ```sh
   npm install
   ```

4. **Set Up Environment Variables**
   Create a `.env` file in the root directory with:
   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```

## Running the Application
Start the server using:
```sh
node server.js
```
Then open the `http://localhost:3001` file in your browser to access the app.

## Project Structure
```
CoffeeWebsite/
│-- server.js               # Main backend logic
│-- package.json            # Project metadata and dependencies
│-- .env                    # Environment configuration
│
├── models/
│   └── orderModel.js       # Mongoose schema for orders
│
├── frontend/
│   ├── a-login.html        # Login page
│   ├── signup.html         # Signup page
│   ├── index.html          # Homepage after login
│   ├── order.html          # Coffee ordering interface
│   ├── script.js           # Frontend JavaScript
│   └── Style.css           # Styling
```

## Usage Instructions
1. **Open `http://localhost:3001` in your browser**
2. **Sign up or log in** to access the coffee shop.
3. **Browse products** and add to your cart via `order.html`.
4. **Click Buy Now** to place the order and store it in MongoDB.

## License
This project is open-source and free for personal or educational use.