# Task: Implement Financial Request Editing

The user wants to allow editing of financial requests only when they are in the 'pending' status. Approved and paid requests should not be editable.

## Status Breakdown
| Status | Editable |
|--------|----------|
| Pending | Yes |
| Approved | No |
| Paid | No |
| Rejected | No (assumed) |

## Implementation Plan

### 1. Update `useFinance.ts`
- Enhance `updateRequest` logic.
- Add a check to ensure only 'pending' requests can be updated if the status is not being changed to something else. Actually, it's better to just allow the update but the UI will control the visibility. However, adding a safety check in the hook is good practice.

### 2. Update `FinanceRequestModal.tsx`
- Add support for an `editingRequest` prop.
- Pre-fill form fields when editing.
- Handle both 'add' and 'update' logic in `handleSubmit`.

### 3. Update `Finance.tsx`
- Add an 'Edit' button (Pencil icon) to the requests table.
- Condition the button on `request.status === 'pending'`.
- Implement `handleEditRequest` to open the modal with the selected request.

### 4. Update `DepartmentDetail.tsx`
- Add an 'Ações' (Actions) column to the requests table.
- Add the 'Edit' button (Pencil icon) conditioned on `request.status === 'pending'`.
- Implement the edit logic.

## Verification
- [ ] Create a new request and verify it can be edited.
- [ ] Approve a request and verify the edit button disappears.
- [ ] Pay a request and verify the edit button remains hidden.
- [ ] Check if 'Rejected' requests are editable (should not be).
