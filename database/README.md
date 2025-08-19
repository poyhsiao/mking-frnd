# Database Configuration for MKing Friend

This directory contains database initialization and test seed files for the MKing Friend application.

## Directory Structure

```
database/
├── README.md           # This file
└── init/              # Database initialization and test data scripts
    ├── 01-init.sql    # Basic database setup and schema
    └── 02-test-data.sql # Sample test data for integration testing
```

## Purpose

This directory structure is used by Docker Compose during testing to:

1. **Initialize the PostgreSQL test database** with basic schema and extensions
2. **Populate test data** for integration and end-to-end testing
3. **Ensure consistent test environment** across local development and CI/CD

## Usage in Docker Compose

The files in this directory are mounted into the PostgreSQL container:

```yaml
volumes:
  - ./database/init:/docker-entrypoint-initdb.d:ro
```

### Execution Order

1. All scripts in **init/** directory run during container startup
2. Scripts are executed in alphabetical order (hence the numeric prefixes)
3. `01-init.sql` runs first to set up the database structure
4. `02-test-data.sql` runs second to populate test data

## File Descriptions

### init/01-init.sql

- Creates the test database if it doesn't exist
- Enables required PostgreSQL extensions (UUID)
- Sets up basic tables for health checks
- Grants necessary permissions
- Provides logging for debugging

### init/02-test-data.sql

- Inserts sample test data
- Creates simplified test tables (users, sessions)
- Provides realistic data for integration testing
- Includes test scenarios for different user types

## Development Guidelines

### Adding New Initialization Scripts

1. Create files with numeric prefixes: `02-feature.sql`, `03-indexes.sql`
2. Use idempotent operations (`CREATE IF NOT EXISTS`, `ON CONFLICT DO NOTHING`)
3. Include proper error handling and logging
4. Test scripts locally before committing

### Adding New Test Data

1. Follow the same naming convention: `03-more-data.sql`, `04-specific-test.sql`
2. Use realistic but anonymized data
3. Ensure data doesn't conflict with existing records
4. Include data for edge cases and error scenarios

### Best Practices

- **Idempotent Scripts**: All scripts should be safe to run multiple times
- **Error Handling**: Use proper PostgreSQL error handling
- **Logging**: Include `RAISE NOTICE` statements for debugging
- **Permissions**: Always grant necessary permissions after creating objects
- **Documentation**: Comment complex operations and business logic

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure Docker has read access to files
2. **Syntax Errors**: Validate SQL syntax before committing
3. **Mounting Errors**: Verify directory structure exists
4. **Execution Order**: Use numeric prefixes to control execution order

### Debugging

To debug database initialization:

```bash
# View PostgreSQL logs
docker-compose -f docker-compose.test.yml logs postgres-test

# Connect to test database
docker-compose -f docker-compose.test.yml exec postgres-test psql -U postgres -d mking_test

# Check if tables were created
\dt

# Verify test data
SELECT * FROM health_check;
SELECT * FROM test_users;
```

## Integration with Prisma

Note: In production, database schema is managed by Prisma migrations located in `backend/prisma/migrations/`. The files in this directory are specifically for:

- **Test environment setup**
- **CI/CD pipeline testing**
- **Local development database initialization**

For production deployments, use Prisma migrations:

```bash
npx prisma migrate deploy
```

## Security Considerations

- **No Production Data**: Never include real user data in test seeds
- **Test Credentials**: Use only test credentials, never production secrets
- **Read-Only Mounting**: Database files are mounted as read-only (`:ro`)
- **Isolated Environment**: Test database runs on different port (5433)

## Related Documentation

- [Docker Best Practices](../docs/docker-best-practices.md)
- [Testing Strategy](../docs/testing/testing-strategy.md)
- [Development Environment Setup](../docs/development-environment-setup.md)
- [Database Schema Design](../docs/database/schema-design.md)