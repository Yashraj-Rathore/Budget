# Budget Analysis Project

## Overview

The Budget Analysis Project is a comprehensive financial management tool designed to help users efficiently manage their personal finances. This web application provides features such as spending analysis, category-wise breakdown of expenses, and budget summaries, empowering users to make informed financial decisions. Built using modern web development tools and frameworks, this project demonstrates a full-stack implementation that integrates front-end and back-end technologies for a seamless user experience.

## Features

- **Spending Analysis**: Provides users with detailed insights into their spending habits, including monthly trends and top spending categories.
- **Category Spending Breakdown**: Displays spending across various categories, enabling users to identify their biggest expenses.
- **Budget Summary**: Includes income vs. expense comparison and category-wise expense visualization to help users understand their overall financial health.
- **Recommendations**: Offers suggestions on managing spending based on historical data.
- **Visualization**: Utilizes charts to visualize monthly spending trends and budget summaries.

## Tech Stack

- **Front-End**: Angular, HTML, CSS, TypeScript
- **Back-End**: Django, Python
- **Database**: PostgreSQL
- **APIs**: RESTful API for data fetching and interaction
- **Other Tools**: Docker for containerization, Matplotlib for visual data representation

## Installation and Setup

1. **Clone the Repository**:

   git clone https://github.com/Yashraj-Rathore/Budget.git
 
2. **Navigate to the Project Directory**:
  
   cd Budget
  
3. **Backend Setup**:
   - Create a virtual environment and activate it.
    
     python -m venv env
     source env/bin/activate # On Windows, use `env\Scripts\activate`
    
   - Install dependencies:
     
     pip install -r requirements.txt
    
   - Run database migrations:
   
     python manage.py migrate
    
   - Start the backend server:
    
     python manage.py runserver
   

4. **Frontend Setup**:
   - Navigate to the front-end directory:
   
     cd frontend/budget-app-frontend
    
   - Install Node.js dependencies:
     
     npm install
    
   - Run the Angular development server:
    
     ng serve
     

5. **Access the Application**:
   - Open your browser and navigate to `http://localhost:4200` to access the frontend.

## Usage

- **Dashboard**: Provides an overview of your financial status, including income and expenses.
- **Transactions**: Users can view and manage individual transactions.
- **Budget Summary**: Visual representation of income vs. expenses and category-wise breakdown.
- **Spending Analysis**: Detailed analysis of spending patterns, including spending trends and top categories.

## Contributing

Contributions are welcome! Please fork the repository and use a feature branch for your changes. Submit a pull request for review.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Contact

For any questions or feedback, feel free to contact me at [rathore.yash6@yahoo.com](mailto:rathore.yash6@yahoo.com).

