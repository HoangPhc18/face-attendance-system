# Cấu hình Mạng Cá Nhân như Mạng Nội Bộ

## IP hiện tại của bạn: `192.168.1.10`

## Cách 1: Tạo file .env (Khuyến nghị)

1. **Tạo file `.env`** từ template:
```bash
copy .env.example .env
```

2. **Chỉnh sửa file `.env`** và cập nhật dòng:
```env
INTERNAL_IP_RANGES=192.168.1.0/24,192.168.0.0/16,10.0.0.0/8,172.16.0.0/12,127.0.0.0/8
```

## Cách 2: Cấu hình Cụ thể cho IP của bạn

Nếu chỉ muốn IP cụ thể của bạn được coi là nội bộ:
```env
INTERNAL_IP_RANGES=192.168.1.10/32,127.0.0.1/32
```

## Cách 3: Cấu hình Toàn bộ Mạng Gia đình

Để toàn bộ mạng Wi-Fi gia đình (192.168.1.x) được coi là nội bộ:
```env
INTERNAL_IP_RANGES=192.168.1.0/24,127.0.0.1/32
```

## Kiểm tra Cấu hình

1. **Khởi động server**:
```bash
python run.py
```

2. **Test network detection**:
```bash
curl http://localhost:5000/api/network/status
```

Kết quả mong đợi:
```json
{
  "success": true,
  "data": {
    "client_ip": "192.168.1.10",
    "is_internal_network": true,
    "network_type": "internal"
  }
}
```

## Giải thích IP Ranges

- `192.168.1.0/24`: Toàn bộ mạng từ 192.168.1.1 đến 192.168.1.254
- `192.168.1.10/32`: Chỉ IP cụ thể 192.168.1.10
- `127.0.0.1/32`: Localhost (luôn cần thiết)

## Lưu ý Bảo mật

- Chỉ thêm những IP/mạng mà bạn tin tưởng
- Mạng nội bộ cho phép chấm công không cần đăng nhập
- Mạng ngoại bộ yêu cầu đăng nhập và bị hạn chế chức năng
