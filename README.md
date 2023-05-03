# Subscription network balance service

## Nodejs service that provides the HTTP API to work with database data.

## Features

- GET /rating

  Displaying invoices sorted by subscription balance + number of network subscribers, login
- POST /subscribe

  Creating a subscription, adds an entry in `subscription` + causes the network balance to be recalculated,
- POST /unsubscribe

  Deleting a subscription, removes the `subscription` line + causes the network balance to be recalculated,

## Usage


```sh
git clone https://github.com/IKidok/
cd 
docker-compose up --build
```
The environment is saved in a .env file.


