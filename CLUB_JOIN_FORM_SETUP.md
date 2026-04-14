# Club Registration Form Setup

## Created
A professional club registration form is available in [Frontend/club-join.html](Frontend/club-join.html).

## Fields
- Name
- Branch
- Roll Number
- Year
- Role
- Interest and Goals

## Branch Options
- Computer Science and Engineering
- Electronics and Communication Engineering
- Information Technology
- Electrical and Electronics Engineering
- Mechanical Engineering
- Chemical Engineering
- Artificial Intelligence and Data Science
- CSM (Computer Science and Engineering - Machine Learning)
- Civil Engineering
- Biotechnology

## Behavior
- Validates all required fields in the browser
- Uses a larger textarea for interest and goals
- Redirects back to the clubs page after submission
- Works on mobile and desktop layouts

## Backend
The submission is handled by `POST /api/clubs/:clubId/request-join` in [routes/clubs.js](routes/clubs.js).

## Database
Run the updates in [UPDATE_DATABASE.sql](UPDATE_DATABASE.sql) to add the club registration fields to `join_requests`.

## Flow
1. Open [Frontend/clubs.html](Frontend/clubs.html)
2. Click Join Club
3. Fill the registration form
4. Submit the request
5. Review it from the admin side if needed
