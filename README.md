# Budget Analysis Project

## Overview
The Budget Analysis Project is a full-stack application designed to help users manage their personal finances effectively. It provides tools for visualizing income versus expenses, analyzing spending patterns, and receiving actionable insights to improve budgeting habits. The application integrates a backend service to collect financial data and a responsive frontend to display that information in an accessible and meaningful way.

## Features
- **Spending Analysis:** Users can view a detailed breakdown of their spending by category and see visual trends over time.
- **Budget Overview:** Provides insights into income versus expenses to help users understand their financial health.
- **Recommendations:** Generates recommendations to optimize spending, providing actionable insights for users.
- **Visualization:** Charts and graphs (e.g., spending trend line, income vs. expenses pie chart) to better understand financial data.

## Tech Stack
- **Frontend:** Angular, HTML, CSS, TypeScript
- **Backend:** Django, Python
- **Database:** PostgreSQL
- **Additional Tools:** Docker, Azure services, Matplotlib

## Setup Instructions

### Prerequisites
Ensure you have the following installed on your system:
- Node.js
- Angular CLI
- Python 3.x
- Docker
- PostgreSQL

### Backend Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/Yashraj-Rathore/Budget.git
   cd Budget/backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv env
   source env/bin/activate  # For Windows: env\Scripts\activate
   ```
3. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up PostgreSQL and update the database credentials in `settings.py`.
5. Run database migrations:
   ```bash
   python manage.py migrate
   ```
6. Start the backend server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend/budget-app-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Angular development server:
   ```bash
   ng serve
   ```
4. Open the application in your browser at `http://localhost:4200`.

### Running with Docker
1. Build and run the Docker container:
   ```bash
   docker-compose up --build
   ```
2. Access the application through `http://localhost:4200`.

## Usage
- Navigate through the dashboard to explore your financial summaries.
- View detailed spending analysis and track monthly trends.
- Use the provided recommendations to make informed financial decisions.

## Project Structure
```
Budget/
├── backend/
│   ├── budget/                # Django app containing backend logic
│   ├── manage.py              # Django project management script
│   └── ...
├── frontend/
│   ├── budget-app-frontend/   # Angular project for the frontend
│   ├── src/
│   │   ├── app/               # Angular components and services
│   │   └── ...
└── README.md
```

## Contributing
Contributions are welcome! Feel free to submit a pull request or open an issue for any bugs or suggestions.

## License
This project is licensed under the MIT License.

## Contact
- **Author:** Yashraj Rathore
- **Email:** [rathore.yash6@yahoo.com](mailto:rathore.yash6@yahoo.com)
- **GitHub:** [Yashraj-Rathore](https://github.com/Yashraj-Rathore)
