VDT COZY IMAGE ROUTE V36

MUC TIEU
- Sua dung loi hien tai: tao anh Cozy nhung log lai chay [flow-auto].
- Noi lai Cozy ve AUTO RIENG da co: src\cozyFlowAutomation.js.
- KHONG sua src\flowAutomation.js.
- KHONG sua auto cac chu de khac.
- KHONG sua cozyVideoAutomation.js / video V35.

SAU V36
Cozy image:
  app.js
    -> /api/cozy/create-reference-image-v36
    -> cozyFlowAutomation.js

Cozy helper 3 REF:
  public\cozyReferenceTripleExternal.js
    -> /api/cozy/create-reference-image-v36
    -> cozyFlowAutomation.js

Module khac:
  -> /api/create-reference-image
  -> flowAutomation.js nhu cu

CAI DAT
1. Dong VDT TOOL.
2. Chay CAI_COZY_IMAGE_ROUTE_V36.cmd.
3. Phai thay [OK] V36 DA CAI XONG + NODE CHECK OK.
4. Mo lai tool.
5. Test TAO TU DONG 3 REF Cozy.

LOG DUNG
[cozy-ref-v36] ROUTE RIENG COZY -> cozyFlowAutomation.js

Khong duoc thay Cozy tao anh bat dau bang route chung /api/create-reference-image nua.
