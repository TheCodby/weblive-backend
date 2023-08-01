# Weblive

Weblive is a simple web application that allows users to stream live video content over the internet. It provides a user-friendly interface for streaming and viewing live video broadcasts. This project is built using Node.js, Nest.js, and Nextjs.

# Frontend project

This is the frontend project, developed using Next.js [Weblive-Website](https://github.com/TheCodby/weblive).

## Getting Started

To run the project using Docker Compose, please follow these steps:

1. Clone the frontend repository:

`git clone https://github.com/TheCodby/weblive.git`

2. Change to the backend project directory:

`cd weblive`

3. Create a `.env` file in the root directory of the froentend project with the following content:

```env
NEXT_PUBLIC_API=http://127.0.0.1:3001
JWT_SECRET=
NEXT_PUBLIC_AWS_S3_BUCKET=
```

4. Run the following commands to start the frontend.
   `npm run build
npm run start`
   Make sure to update the values accordingly if needed.

5. Clone the backend repository:

`git clone https://github.com/TheCodby/weblive-backend.git`

5. Change to the backend project directory:

`cd weblive-backend`

6. Create a `.env` file in the root directory of the froentend project with the following content:

```env
ORIGIN=
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=
DATABASE_URL=
JWT_SECRET=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
ADMIN_PASSWORD=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
REDIS_URL=
```

7. Run the following command to start the project with Docker Compose:

`docker-compose up --build`

This will build and start the necessary containers for the application, including the PostgreSQL database and the API server.

8. Once the containers are up and running, open your web browser and navigate to `http://localhost:3000` to access the application.

## Contributing

Contributions are welcome! If you'd like to contribute to this project, please follow these steps:

1. Fork the repository on GitHub.
2. Create a new branch with a descriptive name for your feature/fix.
3. Make your changes and commit them with clear commit messages.
4. Push your changes to your forked repository.
5. Submit a pull request explaining your changes and the problem they solve.

Please ensure that your code adheres to the existing coding style and conventions used in the project.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.

## Contact

If you have any questions, suggestions, or feedback, please feel free to reach out to the project maintainer:

- Email: [thecodby@gmail.com](mailto:thecodby@gmail.com)
- GitHub: [TheCodby](https://github.com/TheCodby)
