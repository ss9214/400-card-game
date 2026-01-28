const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');
require('dotenv').config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const GAMES_TABLE = process.env.DYNAMODB_GAMES_TABLE || 'games';
const PLAYERS_TABLE = process.env.DYNAMODB_PLAYERS_TABLE || 'players';

async function setupTables() {
  console.log('Creating DynamoDB tables...');

  // Create Games table
  try {
    console.log(`Creating ${GAMES_TABLE} table...`);
    const gamesParams = {
      TableName: GAMES_TABLE,
      KeySchema: [
        { AttributeName: 'code', KeyType: 'HASH' } // Partition key
      ],
      AttributeDefinitions: [
        { AttributeName: 'code', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST' // On-demand pricing
    };
    await client.send(new CreateTableCommand(gamesParams));
    console.log(`✓ ${GAMES_TABLE} table created successfully`);
  } catch (err) {
    if (err.name === 'ResourceInUseException') {
      console.log(`✓ ${GAMES_TABLE} table already exists`);
    } else {
      console.error(`✗ Failed to create ${GAMES_TABLE} table:`, err.message);
    }
  }

  // Create Players table
  try {
    console.log(`Creating ${PLAYERS_TABLE} table...`);
    const playersParams = {
      TableName: PLAYERS_TABLE,
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' } // Partition key
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'game_id', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST',
      GlobalSecondaryIndexes: [
        {
          IndexName: 'game_id-index',
          KeySchema: [
            { AttributeName: 'game_id', KeyType: 'HASH' }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        }
      ]
    };
    await client.send(new CreateTableCommand(playersParams));
    console.log(`✓ ${PLAYERS_TABLE} table created successfully`);
  } catch (err) {
    if (err.name === 'ResourceInUseException') {
      console.log(`✓ ${PLAYERS_TABLE} table already exists`);
    } else {
      console.error(`✗ Failed to create ${PLAYERS_TABLE} table:`, err.message);
    }
  }

  console.log('\nDynamoDB setup complete!');
  process.exit(0);
}

setupTables().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
