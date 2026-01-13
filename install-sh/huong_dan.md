MÔI TRƯỜNG DEV

Hướng dẫn cài đặt và setup tại: https://developer.rocket.chat/docs/linux-and-windows-rocketchat-development-environment

Các script này đã được test ở Rocket.Chat phiên bản 8.1.0-develop

================================================================

CÁC BƯỚC CÀI ĐẶT

B1: Đặt file nén vào thư mục gốc và dùng lệnh: tar -xzvf install-sh.tar.gz để giải nén
B2: cd install-sh
B3: chmod +x config_n_start.sh
B4: ./config_n_start.sh
B5: chmod +x config_brand_client.sh
B6: ./config_brand_client.sh admin_username admin_password

LƯU Ý: config_n_start.sh dùng để set biến môi trường tạm thời và chạy server. Vì config_brand_client.sh có sử dụng api để lưu các settings nên yêu cầu server phải được bật trước khi chạy server (bởi thế mới cần chạy config_n_start.sh trước).

Tại sao lại dùng api?
Vì Rocket.Chat khuyến khích người dùng lưu các settings vào database thay vì mã nguồn để tránh xung đột mã nguồn đối với các bản cập nhật tiếp theo.

Nếu thay đổi màu sắc gặp vấn đề. Hãy vào workspace (Administration) -> settings -> accounts -> Two Factor Authentication -> Tắt Enable Two Factor Authentication

==============================================================

VỊ TRÍ

Vị trí logo: apps/meteor/public/images/logo
Vị trí brand: apps/meteor/client/sidebar/footer/SidebarFooterWatermark.tsx
Vị trí theme color: apps/meteor/app/theme/client

==============================================================

NHỮNG FILE ĐƯỢC THÊM MỚI

- apps/meteor/client/brandingConfig.ts	//Chứa thông tin về công ty
- apps/meteor/client/components/message/toolbar/items/actions/CreateTaskMessageAction.tsx	//Giao diện và logic tạo task
- apps/meteor/app/api/server/v1/users.custom.ts	//Api custom liên quan đến services của user

==============================================================

NHỮNG FILE ĐƯỢC CHỈNH SỬA

- apps/meteor/client/sidebar/footer/SidebarFooterWatermark.tsx
- packages/web-ui-registration/src/components/LoginPoweredBy.tsx
- apps/meteor/public/images/manifest.json
- apps/meteor/client/components/message/toolbar/items/DefaultItems.tsx
- apps/meteor/app/api/server/index.ts
- packages/i18n/src/locales/en.i18n.json
- packages/i18n/src/locales/vi-VN.i18n.json

==============================================================

