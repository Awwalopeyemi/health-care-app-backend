
# Health Care App Backend

This is the backend repository for the Health Care App, a comprehensive system designed to manage patient information, notifications, and authentication. It's built using Node.js and Express, providing a robust API for handling various operations related to healthcare management.

## Features

### User Authentication
- **Registration and Login:** Supports registering and logging in users, including admins, doctors, and patients.
- **Token Management:** Implements JWT for secure authentication and includes endpoints for token refresh and user logout.
- **Role-based Authorization:** Access control for different user roles like Admin, Doctor, and Patient.

### Patient Management
- **Patient Records:** Create, update, view, and delete patient records.
- **Validation:** Extensive validations for patient data including age, gender, and medical history.
- **Access Control:** Only authorized users (Admins and Doctors) can access and modify patient data.

### Notification System
- **User Notifications:** Manage notifications for users with features like marking notifications as read/unread and fetching all notifications for a user.
- **Sorting and Filtering:** Notifications can be sorted (e.g., unread notifications first).

### Appointments Management
- **Appointments:** Create, update, view, and delete appointments.
- **Validation:** Extensive validations for appointment data including date, time, and patient.
- **Access Control:** Appointments are managed according to user roles, patients can only mangage their own appointments, doctors can view all appointments of their patients, and admins can create, update, and delete appointments.

### Testing
- Comprehensive tests using Jest and Supertest for authentication routes, ensuring reliability and performance.

## Installation

1. Clone the repository:
   ```sh
   git clone <repository-url>
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Set up your environment variables in a `.env` file as per the `dotenv` package requirements.

4. Start the server:
   ```sh
   npm start
   ```

## Usage

Run the server and use the provided API endpoints to manage users, patients, and notifications. The server can be accessed typically at `http://localhost:3000`.

### API Endpoints

#### Auth Routes
- POST `/auth/register` - Register a new user.
- POST `/auth/login` - Login a user.
- POST `/auth/logout` - Logout a user.
- POST `/auth/token` - Refresh access token.

#### Patient Routes
- GET, POST, PUT, DELETE `/patients` - Operations related to patient records.

#### Notification Routes
- GET, PUT `/notifications` - Fetch and update notifications.

#### Admin login
- to login as admin use the following credentials:
  - email: admin@example.com
   - password: admin123y8wstJWPg5Tfh3W

- or seed admin data using seedDatabase.js file

## Testing

Run the automated tests using the command:

```sh
npm test
```

## Technologies Used

- **Node.js** and **Express** for the backend.
- **MongoDB** with **Mongoose** for database management.
- **JWT** for authentication.
- **Bcrypt** for password hashing.
- **Passport** for authentication middleware.
- **Jest** and **Supertest** for testing.

## Contributing

Contributions to improve the app are welcome. Please ensure to follow the existing coding style, write tests for new features, and document any changes.

## License

This project is licensed under the ISC License.

---

**Note:** This README is a concise overview and doesn't cover every aspect of the application, such as detailed setup instructions, API usage, and configuration details. More details to be added soon.
