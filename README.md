# ioriver-hue

A Ioriver plugin for Philips Hue

## Configuration

```json
{
  
 "platforms":[
        {
            "platform":"ioriver-hue",
            "name":"My Hue",
            "ip": "10.0.48.95",
            "sn_x1000":2,
            "username":"MY_HUE_USERNAME",
            "ignore_id_list": [1,2,3]
        }
    ]
}
```

## Setup

See raw-hue-api

## Version history

### 0.1.0

- Philips Motion Sensor support for presence, temperature and light level