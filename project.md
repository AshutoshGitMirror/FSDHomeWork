Design and develop a backend application using MongoDB and Node.js to manage a User
Management System. Students are required to create a MongoDB collection named users
with the following fields:
● name (String, required, minimum 3 characters)
● email (String, required, unique, valid email format)
● age (Number, minimum 0, maximum 120)
● hobbies (Array of Strings)
● bio (String, for text search)
● userId (String, unique identifier for hashed index)
● createdAt (Date, default current date for TTL index)
Students must define a schema using Mongoose with appropriate validations for each field.
Objectives:
To understand the integration of MongoDB with a Node.js backend
To design a User schema with proper validation using Mongoose
To implement CRUD operations using RESTful APIs
To perform querying, filtering, sorting, and pagination
To understand and implement different types of MongoDB indexes
To analyze query performance using .explain("executionStats")
To test API endpoints using Postman

Tasks to Perform:

Fr. Conceicao Rodrigues College of Engineering
Father Agnel Ashram, Bandstand, Bandra –west, Mumbai-50
Department of Computer Engineering

1. Database Integration
○ Connect Node.js backend to MongoDB using Mongoose.
○ Store connection string securely using .env.
2. CRUD Operations
○ Create API to insert user data (POST)
○ Retrieve all users (GET)
○ Update user by ID (PUT)
○ Delete user by ID (DELETE)
3. Querying & Filtering
○ Search users by name
○ Filter using email and age
○ Find users based on hobbies
○ Perform text search on bio
4. Index Implementation
Students must create and apply the following indexes:
○ Single field index on name
○ Compound index on email and age
○ Multikey index on hobbies
○ Text index on bio
○ Hashed index on userId
○ TTL index on createdAt
5. Index Testing
○ Create a script (index-test.js)
○ Insert sample data
○ Use .explain("executionStats") to analyze:
■ keys examined
■ documents examined
■ execution time

6. API Testing
○ Test all endpoints using Postman
○ Verify correct responses and database changes

Post-lab Questions:
1.How would you modify your API to check index usage using .explain() in Postman?
2.You created a compound index:
{ email: 1, age: -1 }
Which of the following queries will use this index and which will not? Explain why:
● find({ email: "test@gmail.com" })
● find({ age: 25 })
● find({ email: "test@gmail.com", age: 25 })
3.If your schema has:

Fr. Conceicao Rodrigues College of Engineering
Father Agnel Ashram, Bandstand, Bandra –west, Mumbai-50
Department of Computer Engineering

email: { type: String, required: true, unique: true }
What will happen if you send a POST request:
● without email
● with a duplicate email
Will both give the same error? Explain the difference.