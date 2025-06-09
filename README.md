# Dynamic Mock API Generator

> Your personal, on-the-fly backend for frontend development.

This project provides a set of command-line tools to instantly spin up a mock REST API server. It's designed to unblock frontend developers from backend dependencies, allowing for rapid prototyping and development against a realistic, customizable API.

The generator offers two powerful modes of operation:
1.  **Automatic Mode:** Generates a complete, JSON:API-compliant REST API from a single sentence describing your data relationships.
2.  **Simple Manual Mode:** Lets you define each endpoint and its exact JSON response structure, one by one, for maximum flexibility.

## Features

-   **Dockerized:** Run everything in a self-contained, portable Docker container. No local Node.js setup required.
-   **Interactive CLI:** User-friendly prompts guide you through the setup process.
-   **Natural Language Parsing:** The automatic mode understands simple sentences like "a user has many posts".
-   **Fully Customizable Endpoints:** The manual mode gives you full control over paths and response bodies.
-   **Dynamic Data Generation:** Uses **[@faker-js/faker](https://fakerjs.dev/)** to populate your API with realistic mock data.
-   **Static & Dynamic Data Mixing:** Define fixed values (like `"status": "active"`) alongside dynamic ones (`"name": "faker.person.fullName"`).
-   **Zero Configuration:** Just answer the prompts and your server is live.

## Prerequisites

-   [Docker](https://www.docker.com/products/docker-desktop/) installed and running on your machine.

OR

-   [Node.js](https://nodejs.org/) (version 14.x or newer recommended)
-   [npm](https://www.npmjs.com/) (usually comes with Node.js)


## Docker

### 1. Run start command
```bash
./start.sh
```

* This shell script is a simple wrapper for the docker compose run command with arguments
* A compose file technically not needed as theres only one service and the docker build and docker start could be run in the start.sh, but included for scalability and seperation of concerns (shell script is a simple wrapper)


### 2. Choose Your Mode

```text
=========================================
  Dynamic Mock API Generator
=========================================
Select which API server to start:
  1) Automatic Mode (from a sentence)
  2) Simple Manual Mode (endpoint by endpoint)

Enter your choice (1 or 2):
```


### Build the Docker Image (if needed)

uild the Docker image from the provided `Dockerfile`. This command only needs to be run once, or whenever you change the source code or dependencies.

Navigate to the project's root directory in your terminal and run:

```bash
docker build -t dynamic-api .
```

-t dynamic-api assigns the name dynamic-api to the image.

### Run the Container (if needed)

Run the container. This command will start the interactive menu, allowing you to choose which API server to launch.

```bash
docker run --rm -it -p 3001:3001 -p 3002:3002 dynamic-api
```

* --rm: Automatically removes the container when it stops, keeping your system clean.
* -it: Essential for interactivity. It connects your terminal to the container's input/output.
* -p 3001:3001: Maps port 3001 on your machine to port 3001 in the container (for the Automatic API).
* -p 3002:3002: Maps port 3002 on your machine to port 3002 in the container (for the Manual API).
* dynamic-api: The name of the image.


## Local (Non docker)

### Installation

1.  Clone this repository or download the files into a new directory.
2.  Navigate into the project directory:
    ```bash
    cd dynamic-api-generator
    ```
3.  Install the required dependencies:
    ```bash
    npm install
    ```

### Start

Automatic mode:
```bash
npm run auto
```

Manual mode:
```bash
npm run manual
```

## Usage

The project is controlled via npm scripts defined in `package.json`. You can choose which mode you want to run.

#### Mode 1: Automatic API (from a sentence)

This mode is perfect when you need a standard, RESTful, and relational API quickly. It generates endpoints that follow the JSON:API specification.

**1. Describe Your Data:**
The script will prompt you to describe your entity relationships in a single sentence.
? Describe your entity relationships: (a university has many programs and each program has many domains)
> a blog has many posts and each post has many comments

**2. Your API is Live!**
The server will start on localhost and list the generated endpoints
```bash
🚀 Automatic API Server is running on http://localhost:xxxx
----------------------------------------------------
✅ Generated the following endpoints:
   GET  /blogs
   GET  /blogs/:id
   GET  /blogs/:id/posts
   GET  /posts
   GET  /posts/:id
   GET  /posts/:id/comments
   GET  /comments
   GET  /comments/:id
----------------------------------------------------
```

#### Mode 2: Manual API (endpoint by endpoint)
This mode is ideal when you need to mock specific, non-standard endpoints or have a very precise response structure in mind.


**1. Build Your Endpoints**
The script will repeatedly ask you to define endpoints until you are finished.
Prompt 1: Add an endpoint? Choose Yes.
Prompt 2: Enter the path. For example, /users or /users/:id/profile.
Prompt 3: Define the JSON response. Your default text editor will open. Here you can define the exact structure of a single item, using Faker.js for dynamic data.

Example:
```bash
? Do you want to add a new endpoint? Yes
? Enter the endpoint path (e.g., /users or /users/:id): /products
? Define the JSON response for a single item. (Opens in your editor)
```

Editor Content for /products:
```json
{
  "sku": "faker.string.alphanumeric",
  "productName": "faker.commerce.productName",
  "price": "faker.commerce.price",
  "status": "available"
}
```
**2. Your API is Live!**
The server will start on localhost and list the generated endpoints
```bash
🚀 Manual API Server is running on http://localhost:xxxx
----------------------------------------------------
✅ Generated the following endpoints:
   GET  /products
----------------------------------------------------
```

## How to Define Response Bodies (Manual Mode)
You have full control over the response structure.
For Static Data: Use any standard JSON value (string, number, boolean). This value will be the same in every response.
For Dynamic Data: Use a string with the prefix faker. followed by a [Faker.js](https://fakerjs.dev/api/) API path. This will generate a new, random value for each item.
Example JSON definition mixing static and dynamic data:
```json
{
  "id": "faker.string.uuid",
  "username": "faker.internet.userName",
  "email": "faker.internet.email",
  "account_type": "standard_user", 
  "is_active": true
}
```