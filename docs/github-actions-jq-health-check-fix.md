# GitHub Actions jq Health Check Fix

## Problem Description

The GitHub Actions CI/CD pipeline was failing during e2e tests with the following error:

```
jq: error (at <stdin>:1): Cannot index string with string "Service"
```

This error occurred in the `check_container_health` function when trying to extract the health status of Docker Compose services using jq.

## Root Cause Analysis

### Original Problematic Command

```bash
health_status=$(docker compose -f docker-compose.test.yml ps --format json | jq -r ".[] | select(.Service == \"${service_name}\") | .Health")
```

### Issue Identification

1. **Docker Compose JSON Output Format**: The `docker compose ps --format json` command outputs each service as a separate JSON object on individual lines, not as a JSON array.

2. **Single Service Output**:
   ```json
   {"Service":"postgres-test","Health":"healthy",...}
   ```

3. **Multiple Services Output**:
   ```
   {"Service":"minio-test","Health":"starting",...}
   {"Service":"postgres-test","Health":"healthy",...}
   ```

4. **jq Array Iteration Issue**: The original command used `.[]` to iterate over an array, but the input was individual JSON objects, not an array.

## Solution Implementation

### Fixed Command

```bash
health_status=$(docker compose -f docker-compose.test.yml ps --format json | jq -s -r ".[] | select(.Service == \"${service_name}\") | .Health")
```

### Key Changes

1. **Added `-s` (slurp) flag**: This flag tells jq to read the entire input stream and convert it into a single array.
2. **Maintained `.[]` iteration**: Now that we have an array (thanks to `-s`), the `.[]` iteration works correctly.

### How the Fix Works

1. `docker compose ps --format json` outputs multiple JSON objects:
   ```
   {"Service":"minio-test",...}
   {"Service":"postgres-test",...}
   ```

2. `jq -s` converts this to an array:
   ```json
   [
     {"Service":"minio-test",...},
     {"Service":"postgres-test",...}
   ]
   ```

3. `.[] | select(.Service == "postgres-test") | .Health` then works correctly to filter and extract the health status.

## BDD Test Implementation

### Feature File

Created `features/github-actions-jq-health-check.feature` with comprehensive scenarios:

- jq command successfully parses Docker Compose JSON output
- jq command handles different health states correctly
- jq command handles edge cases gracefully
- Robust jq command with error handling
- GitHub Actions workflow uses corrected jq command

### Step Definitions

Implemented `features/step_definitions/github-actions-jq-health-check.steps.ts` with:

- Docker Compose service management
- JSON parsing validation
- jq command testing
- Error handling verification
- Multi-service scenario testing

## Validation Results

### Before Fix
```bash
$ echo '{"Service":"postgres-test","Health":"starting"}' | jq -r '.[] | select(.Service == "postgres-test") | .Health'
jq: error (at <stdin>:1): Cannot index string with string "Service"
```

### After Fix
```bash
$ echo '{"Service":"postgres-test","Health":"starting"}' | jq -s -r '.[] | select(.Service == "postgres-test") | .Health'
starting
```

### Multi-Service Testing
```bash
$ docker compose -f docker-compose.test.yml ps --format json | jq -s -r '.[] | select(.Service == "postgres-test") | .Health'
healthy
```

## Files Modified

1. **`.github/workflows/ci.yml`**: Updated the jq command in the `check_container_health` function
2. **`features/github-actions-jq-health-check.feature`**: Created BDD feature file
3. **`features/step_definitions/github-actions-jq-health-check.steps.ts`**: Created step definitions
4. **`docs/github-actions-jq-health-check-fix.md`**: This documentation

## Benefits of the Fix

1. **Reliability**: Eliminates the jq parsing error that was causing CI/CD failures
2. **Robustness**: Works correctly with both single and multiple Docker Compose services
3. **Maintainability**: Clear, understandable command structure
4. **Test Coverage**: Comprehensive BDD tests ensure the fix works in various scenarios
5. **Documentation**: Detailed explanation for future maintenance

## Best Practices Applied

1. **BDD Methodology**: Used Behavior-Driven Development to define and validate the fix
2. **Root Cause Analysis**: Thoroughly investigated the underlying issue
3. **Comprehensive Testing**: Tested with various service configurations
4. **Documentation**: Detailed documentation for future reference
5. **Minimal Change**: Fixed the specific issue without unnecessary modifications

## Future Considerations

1. **Alternative Approaches**: Consider using `docker inspect` for health checks if more detailed information is needed
2. **Error Handling**: Add additional error handling for edge cases
3. **Performance**: Monitor the impact of the `-s` flag on large service configurations
4. **Monitoring**: Add logging to track health check performance in CI/CD

## Related Issues

- PostgreSQL health check environment variable fix
- Docker Compose test configuration optimization
- GitHub Actions workflow reliability improvements