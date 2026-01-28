const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand, ScanCommand, DeleteCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config();

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const docClient = DynamoDBDocumentClient.from(client);

// Table names
const GAMES_TABLE = process.env.DYNAMODB_GAMES_TABLE || 'games';
const PLAYERS_TABLE = process.env.DYNAMODB_PLAYERS_TABLE || 'players';

module.exports = {
  docClient,
  GAMES_TABLE,
  PLAYERS_TABLE,
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  ScanCommand,
  DeleteCommand,
  BatchWriteCommand
};
