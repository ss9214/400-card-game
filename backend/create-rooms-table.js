const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { CreateTableCommand } = require('@aws-sdk/client-dynamodb');
require('dotenv').config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function createRoomsTable() {
  const params = {
    TableName: process.env.DYNAMODB_ROOMS_TABLE || 'rooms',
    KeySchema: [
      { AttributeName: 'code', KeyType: 'HASH' } // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'code', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST' // On-demand pricing
  };

  try {
    const command = new CreateTableCommand(params);
    const result = await client.send(command);
    console.log('Table created successfully:', result.TableDescription.TableName);
    console.log('Table status:', result.TableDescription.TableStatus);
    console.log('\nWait for table to become ACTIVE before using it.');
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('Table already exists');
    } else {
      console.error('Error creating table:', error);
    }
  }
}

createRoomsTable();
