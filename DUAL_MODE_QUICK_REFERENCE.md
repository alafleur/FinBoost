# Dual-Mode Disbursement Quick Reference

## Quick Implementation Guide

### API Endpoints

**Process Disbursements**:
```
POST /api/admin/winner-cycles/:cycleId/process-disbursements
```

**Get Eligible Count**:
```
GET /api/admin/cycle-winner-details/:cycleId/eligible-count
```

### Request Formats

**Bulk Mode**:
```json
{ "processAll": true }
```

**Selective Mode**:
```json
{ "selectedWinnerIds": [1, 2, 3] }
```

### Frontend Implementation

```javascript
// Mode detection
const isBulkMode = selectedForDisbursement.size === 0;

// Request body
const requestBody = isBulkMode 
  ? { processAll: true }
  : { selectedWinnerIds: Array.from(selectedForDisbursement) };

// Button text
const buttonText = isBulkMode
  ? `Process All Eligible (${eligibleCount})`
  : `Process Selected (${selectedForDisbursement.size})`;
```

### UI Features

- **Blue**: Bulk mode operations
- **Green**: Selective mode operations
- **BULK/SELECT**: Mode indicator badges
- **Globe**: Bulk mode icon
- **CheckSquare**: Selective mode icon

### Testing Commands

```bash
# Run comprehensive tests
node test-chatgpt-step4-comprehensive-testing.js

# Test bulk mode
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -d '{"processAll": true}' \
  http://localhost:5000/api/admin/winner-cycles/1/process-disbursements

# Test selective mode  
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -d '{"selectedWinnerIds": [1,2,3]}' \
  http://localhost:5000/api/admin/winner-cycles/1/process-disbursements
```

### Key Files

- `server/routes.ts`: Backend endpoint logic
- `client/src/components/admin/CycleOperationsTab.tsx`: Frontend implementation
- `shared/schema.ts`: Database schema definitions

### Success Verification

✅ Button shows correct mode and count  
✅ Color scheme matches mode (blue/green)  
✅ Status panel updates in real-time  
✅ Both request types work correctly  
✅ Error handling covers edge cases