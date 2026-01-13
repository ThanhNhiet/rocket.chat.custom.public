# ==========================================
# SCRIPT CẤU HÌNH ROCKET.CHAT WHITE-LABEL
# ==========================================

#Kiểm tra tham số đầu vào cho 2 biến admin_user và admin_pass
if [ "$#" -ne 2 ]; then
    echo "LỖI: Thiếu tên đăng nhập admin và mật khẩu."
    echo "Vui lòng chỉnh sửa trực tiếp các biến trong file config_brand_client.sh"
    exit 1
fi
ADMIN_USER="$1"
ADMIN_PASS="$2"

echo "KIỂM TRA MÔI TRƯỜNG..."
if ! command -v jq &> /dev/null; then
    echo " -> 'jq' chưa được cài đặt. Đang tiến hành cài đặt..."
    sudo apt-get update && sudo apt-get install -y jq
    echo "Đã cài đặt jq thành công."
else
    echo "'jq' đã có sẵn."
fi

# ==========================================
# Đổi ảnh background login
RC_URL="http://localhost:3000"
IMAGE_FILE="./images/background_login.png"
# 1. Đăng nhập để lấy Token
echo " -> Đang đăng nhập..."
LOGIN_RESPONSE=$(curl -s -X POST "$RC_URL/api/v1/login" \
     -H "Content-type: application/json" \
     -d "{ \"user\": \"$ADMIN_USER\", \"password\": \"$ADMIN_PASS\" }")

STATUS=$(echo $LOGIN_RESPONSE | jq -r .status)

if [ "$STATUS" != "success" ]; then
    echo "Đăng nhập thất bại! Kiểm tra lại user/pass."
    exit 1
fi
# Trích xuất Token và UserID
AUTH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r .data.authToken)
USER_ID=$(echo $LOGIN_RESPONSE | jq -r .data.userId)
echo "Đăng nhập thành công"

# 2. Upload ảnh vào Database
echo " -> Đang upload ảnh vào Database..."
if [ ! -f "$IMAGE_FILE" ]; then
    echo "Lỗi: Không tìm thấy file ảnh tại: $IMAGE_FILE"
    exit 1
fi
UPLOAD_RESPONSE=$(curl -s -X POST "$RC_URL/api/v1/assets.setAsset" \
     -H "X-Auth-Token: $AUTH_TOKEN" \
     -H "X-User-Id: $USER_ID" \
     -F "assetName=background_dark" \
     -F "asset=@$IMAGE_FILE")

SUCCESS=$(echo $UPLOAD_RESPONSE | jq -r .success)

if [ "$SUCCESS" == "true" ]; then
    echo "THÀNH CÔNG! Ảnh đã được ghi vào Database."
else
    echo "Lỗi khi upload."
    exit 1
fi
echo " -> Đang upload ảnh cho Light Theme (Dự phòng)..."
curl -s -X POST "$RC_URL/api/v1/assets.setAsset" \
     -H "X-Auth-Token: $AUTH_TOKEN" \
     -H "X-User-Id: $USER_ID" \
     -F "assetName=background" \
     -F "asset=@$IMAGE_FILE;type=image/png" > /dev/null

echo "-------------------------------------------------"
echo "HOÀN TẤT UPLOAD ẢNH"
echo "-------------------------------------------------"
#==========================================

# Tham số đầu vào
POWERED_COMPANY="Powered by SaiGon GreenTech"
POWERED_COMPANY_LINK="https://saigongreentech.com"
CLIENT_NAME="SaiGon GreenTech"
CLIENT_LINK="https://saigongreentech.com"
EXTRA_INFO="Hotline: 1900"
LOGO_PATH="./logo"

#==========================================
# 1. KHU VỰC NỘI DUNG CHÍNH (Nút bấm, highlight)
COLOR_PRIMARY="#3976D1"

# 2. KHU VỰC NAVBAR TOP
COLOR_NAVBAR_BG="#3b7939"

# 3.KHU VỰC SIDEBAR BÊN TRÁI 
# Màu nền chính của Sidebar - Màu phải đậm để màu chữ trắng nổi bật
COLOR_SIDEBAR_BG="#394479" 
# Màu nền khi hover Channel - Màu phải tách biệt với nền sidebar và navbar
COLOR_SIDEBAR_TOP_HOVER="#00122b"
# Màu nền item khi được chọn
COLOR_SIDEBAR_ITEM_SELECTED="#4dae47"
# Màu nền item khi được hover
COLOR_SIDEBAR_ITEM_HOVER="#0049ad"

# 4. KHU VỰC FOOTER SIDEBAR - Màu phải khác với logo và màu trắng
COLOR_FOOTER_BG="#001d45" 
#==========================================


# Định nghĩa đường dẫn
METEOR_DIR="../apps/meteor"
CONFIG_FILE="$METEOR_DIR/client/brandingConfig.ts"
SOURCE_FILES_DIR="./files"
SOURCE_FILES_DIR_ADD="./files/add"  # Thư mục chứa các file code mẫu cần thêm mới
SOURCE_FILES_DIR_MODIFY="./files/modify"    # Thư mục chứa các file code mẫu cần ghi đè


echo "--------------------------------------------------"
echo "Đang cấu hình cho khách hàng: $CLIENT_NAME"
echo "--------------------------------------------------"

# 1. TẠO FILE CẤU HÌNH
echo "[1/6] Đang tạo file cấu hình brandingConfig.ts..."

# Lệnh này sẽ tạo file mới hoặc ghi đè toàn bộ nội dung nếu file đã tồn tại
cat > "$CONFIG_FILE" <<EOF
export const BRANDING = {
    POWERED_BY: "Powered by $POWERED_COMPANY",
    POWERED_BY_LINK: "$POWERED_COMPANY_LINK",
    CLIENT_NAME: "$CLIENT_NAME",
    CLIENT_LINK: "$CLIENT_LINK",
    EXTRA_INFO: "$EXTRA_INFO",
    SHOW_WATERMARK: true
};
EOF

# 2. XỬ LÝ LOGO VÀ ASSETS
echo "[2/6] Đang xử lý Logo và Assets..."

if [ -d "$LOGO_PATH" ]; then
    echo " -> Copy toàn bộ ảnh từ $LOGO_PATH vào public/images/..."
    cp -rf "$LOGO_PATH/"* "$METEOR_DIR/public/images/logo"
else
    echo " -> CẢNH BÁO: Không tìm thấy thư mục logo tại $LOGO_PATH"
fi

# 3. GHI ĐÈ FILE SOURCE CODE
echo "[3/6] Đang ghi đè các file giao diện từ thư mục ./files ..."

if [ -d "$SOURCE_FILES_DIR_MODIFY" ]; then
    # Ghi đè Sidebar Footer
    echo " -> Copy SidebarFooterWatermark.tsx..."
    cp -f "$SOURCE_FILES_DIR_MODIFY/SidebarFooterWatermark.tsx" "$METEOR_DIR/client/sidebar/footer/SidebarFooterWatermark.tsx"

    # Ghi đè Login Powered By
    echo " -> Copy LoginPoweredBy.tsx..."
    DEST_LOGIN="../packages/web-ui-registration/src/components/LoginPoweredBy.tsx"
    if [ -f "$DEST_LOGIN" ]; then
         cp -f "$SOURCE_FILES_DIR_MODIFY/LoginPoweredBy.tsx" "$DEST_LOGIN"
    else
         echo " -> Không tìm thấy đích đến cho LoginPoweredBy.tsx, đang tìm kiếm..."
         find packages -name "LoginPoweredBy.tsx" -exec cp "$SOURCE_FILES_DIR_MODIFY/LoginPoweredBy.tsx" {} \;
    fi
    # --- CHÈN NỘI DUNG VÀO FILE ---
    if [ -n "$DEST_LOGIN" ] && [ -f "$DEST_LOGIN" ]; then
        echo " -> Đang tiêm biến vào file: $DEST_LOGIN"
        
        # 1. Thay thế URL
        sed -i "s#const POWERED_BY_URL = null;#const POWERED_BY_URL = '$POWERED_COMPANY_LINK';#g" "$DEST_LOGIN"
        
        # 2. Thay thế Text
        sed -i "s#const POWERED_BY_TEXT = null;#const POWERED_BY_TEXT = '$POWERED_COMPANY';#g" "$DEST_LOGIN"
        
        echo "Đã cập nhật Powered By: $POWERED_COMPANY"
    else
        echo "Lỗi: Không xác định được file LoginPoweredBy.tsx để chỉnh sửa."
    fi

    # Ghi đè DefaultItems.tsx
    echo " -> Copy DefaultItems.tsx..."
    cp -f "$SOURCE_FILES_DIR_MODIFY/DefaultItems.tsx" "$METEOR_DIR/client/components/message/toolbar/items/DefaultItems.tsx"

    # Ghi đè server/index.ts
    echo " -> Copy server index.ts..."
    cp -f "$SOURCE_FILES_DIR_MODIFY/index.ts" "$METEOR_DIR/app/api/server/index.ts"

    # Ghi đè file translations
    # echo " -> Copy vi.i18n.json..."
    # cp -f "$SOURCE_FILES_DIR/i18n/vi.i18n.json" "../packages/i18n/src/locales/vi-VN.i18n.json"
    # echo " -> Copy en.i18n.json..."
    # cp -f "$SOURCE_FILES_DIR/i18n/en.i18n.json" "../packages/i18n/src/locales/en.i18n.json"

    # Ghi đè Manifest ở public/images
    echo " -> Copy manifest.json..."
    cp -f "$SOURCE_FILES_DIR/public/images/manifest.json" "$METEOR_DIR/public/images/manifest.json"
    
else
    echo " -> LỖI: Không tìm thấy thư mục $SOURCE_FILES_DIR. Vui lòng tạo thư mục này và bỏ file mẫu vào."
    exit 1
fi

# 4. THÊM MỚI FILE SOURCE CODE
echo "[4/6] Đang thêm mới các file giao diện từ thư mục ./files/add ..."
if [ -d "$SOURCE_FILES_DIR_ADD" ]; then
    # 4.1 Thêm mới CreateTaskMessageAction.tsx
    echo " -> Copy CreateTaskMessageAction.tsx..."
    cp -f "$SOURCE_FILES_DIR_ADD/CreateTaskMessageAction.tsx" "$METEOR_DIR/client/components/message/toolbar/items/actions/CreateTaskMessageAction.tsx"

    # 4.2 Thêm mới users.custom.ts
    echo " -> Copy users.custom.ts..."
    cp -f "$SOURCE_FILES_DIR_ADD/users.custom.ts" "$METEOR_DIR/app/api/server/v1/users.custom.ts"
else
    echo " -> LỖI: Không tìm thấy thư mục $SOURCE_FILES_DIR_ADD. Vui lòng tạo thư mục này và bỏ file mẫu vào."
    exit 1
fi

# 5. XỬ LÝ MÀU SẮC
# # ======================================

echo "[5/6] Đang cấu hình giao diện theo màu chủ đạo..."
read -r -d '' RAW_CSS << EOM
.rcx-content--main {
    --rcx-color-button-background-primary-default: $COLOR_PRIMARY !important;
    --rcx-color-button-background-primary-hover: $COLOR_PRIMARY !important;
    --rcx-color-button-background-primary-press: $COLOR_PRIMARY !important;
    --rcx-color-button-background-primary-focus: $COLOR_PRIMARY !important;
    --rcx-color-stroke-highlight: $COLOR_PRIMARY !important;
}
.rcx-sidebar--main {
    --rcx-color-surface-sidebar: $COLOR_SIDEBAR_BG !important;
    --rcx-color-surface-tint: $COLOR_SIDEBAR_TOP_HOVER !important;
    --rcx-color-surface-selected: $COLOR_SIDEBAR_ITEM_SELECTED !important;
    --rcx-color-surface-hover: $COLOR_SIDEBAR_ITEM_HOVER !important;
}
.rcx-sidebar-footer {
    background-color: $COLOR_FOOTER_BG !important;
}
.rcx-navbar {
    background-color: $COLOR_NAVBAR_BG !important;
}
EOM

# Tạo payload JSON
PAYLOAD=$(jq -n --arg value "$RAW_CSS" '{value: $value}')

# Gọi API cập nhật
UPDATE_CSS_RESPONSE=$(curl -s -X POST "$RC_URL/api/v1/settings/theme-custom-css" \
     -H "X-Auth-Token: $AUTH_TOKEN" \
     -H "X-User-Id: $USER_ID" \
     -H "Content-type: application/json" \
     -d "$PAYLOAD")

SUCCESS_CSS=$(echo $UPDATE_CSS_RESPONSE | jq -r .success)

if [ "$SUCCESS_CSS" == "true" ]; then
    echo "Đã cập nhật Custom CSS vào Database thành công."
else
    echo "Lỗi khi cập nhật CSS."
fi

# 6. CẬP NHẬT BIẾN TRONG MANIFEST
echo "[6/6] Đang cập nhật nội dung manifest.json..."
MANIFEST_FILE="$METEOR_DIR/public/images/manifest.json"

if [ -f "$MANIFEST_FILE" ]; then
    sed -i "s/\"name\": \"[^\"]*\"/\"name\": \"$CLIENT_NAME\"/g" "$MANIFEST_FILE"
    sed -i "s/\"short_name\": \"[^\"]*\"/\"short_name\": \"$CLIENT_NAME\"/g" "$MANIFEST_FILE"
else
    echo " -> Cảnh báo: Không tìm thấy file $MANIFEST_FILE để sửa tên."
fi


curl -s -X POST "$RC_URL/api/v1/logout" \
     -H "X-Auth-Token: $AUTH_TOKEN" \
     -H "X-User-Id: $USER_ID" > /dev/null
echo "--------------------------------------------------"
echo "HOÀN TẤT CẤU HÌNH!"
echo "Vui lòng đợi server tự restart hoặc chạy lại lệnh: yarn dsv để áp dụng."
echo "--------------------------------------------------"