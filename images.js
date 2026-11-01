// 圖片來源：Wikimedia Commons 自由授權圖片（由 build 腳本產生）
const IMAGES = {
  "hero": {
    "src": "images/hero.jpg",
    "alt": "五顏六色的樂高積木",
    "artist": "Benjamin D. Esham (bdesham)",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Lego_bricks.jpg"
  },
  "stage1": {
    "src": "images/stage1.jpg",
    "alt": "一堆樂高積木",
    "artist": "Grendelkhan",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Pile_of_light_gray_LEGO_bricks_at_a_LEGO_store.jpg"
  },
  "stage2": {
    "src": "images/stage2.jpg",
    "alt": "樂高城市系列火車",
    "artist": "Josh Hallett from Winter Haven, FL, USA",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "page": "https://commons.wikimedia.org/wiki/File:LEGO_7897_City_Passenger_Train_-_2006.jpg"
  },
  "stage3": {
    "src": "images/stage3.jpg",
    "alt": "用 SPIKE 做的樂高機器人",
    "artist": "Stilfehler",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Lego_Spike_Robot_1.jpg"
  },
  "l1": {
    "src": "images/l1.jpg",
    "alt": "用樂高蓋成的高塔",
    "artist": "ssr",
    "license": "Public domain",
    "licenseUrl": "",
    "page": "https://commons.wikimedia.org/wiki/File:LEGO_tower_on_Manezh_Square_in_Moscow.JPG"
  },
  "l2": {
    "src": "images/l2.jpg",
    "alt": "拱形石橋",
    "artist": "Marcbela (Marc N. Belanger)",
    "license": "Public domain",
    "licenseUrl": "",
    "page": "https://commons.wikimedia.org/wiki/File:Keeseville_Stone_Bridge.jpg"
  },
  "l3": {
    "src": "images/l3.jpg",
    "alt": "樂高小車",
    "artist": "HIBIKIFL",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "page": "https://commons.wikimedia.org/wiki/File:Lego_Technic_Red_Car_(42491444060).jpg"
  },
  "l4": {
    "src": "images/l4.jpg",
    "alt": "樂高 Technic 農用車",
    "artist": "Lasse Deleuran",
    "license": "Public domain",
    "licenseUrl": "",
    "page": "https://commons.wikimedia.org/wiki/File:LEGO_Technic_John_Deere_6130R.jpg"
  },
  "l5": {
    "src": "images/l5.jpg",
    "alt": "樂高 Technic 齒輪",
    "artist": "Brickset from UK",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "page": "https://commons.wikimedia.org/wiki/File:Lego_Technic_gears_red,blue,yellow_(42457828342).jpg"
  },
  "l6": {
    "src": "images/l6.jpg",
    "alt": "大小不同的樂高齒輪",
    "artist": "Oz1sej",
    "license": "Public domain",
    "licenseUrl": "",
    "page": "https://commons.wikimedia.org/wiki/File:Lego_technic_gears.jpg"
  },
  "l7": {
    "src": "images/l7.gif",
    "alt": "蝸桿帶動齒輪（動畫）",
    "artist": "Quant3",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
    "page": "https://commons.wikimedia.org/wiki/File:Schnecke10.gif"
  },
  "l8": {
    "src": "images/l8.jpg",
    "alt": "用樂高做出的大型創意作品",
    "artist": "Crannofonix",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Volvo_car_made_out_of_LEGO.jpg"
  },
  "l9": {
    "src": "images/l9.jpg",
    "alt": "組好的樂高火車",
    "artist": "Josh Hallett from Winter Haven, FL, USA",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "page": "https://commons.wikimedia.org/wiki/File:LEGO_7897_City_Passenger_Train_-_2006_-_(1).jpg"
  },
  "l10": {
    "src": "images/l10.jpg",
    "alt": "樂高高速列車",
    "artist": "Mich973",
    "license": "CC BY-SA 2.5 si",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.5/si/deed.en",
    "page": "https://commons.wikimedia.org/wiki/File:Lego_speed_train.JPG"
  },
  "l11": {
    "src": "images/l11.jpg",
    "alt": "拉著車廂的樂高火車頭",
    "artist": "Adrián Pérez from Helsinki, Finland",
    "license": "CC BY-SA 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
    "page": "https://commons.wikimedia.org/wiki/File:Lego_articulated_locomotive.jpg"
  },
  "l12": {
    "src": "images/l12.jpg",
    "alt": "樂高火車軌道",
    "artist": "J R S N Barnecut",
    "license": "Public domain",
    "licenseUrl": "",
    "page": "https://commons.wikimedia.org/wiki/File:LegoTrack.jpg"
  },
  "l13": {
    "src": "images/l13.jpg",
    "alt": "有場景和機關的樂高火車佈景",
    "artist": "Bill Ward from El Cerrito, CA, USA",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "page": "https://commons.wikimedia.org/wiki/File:Brickvention_2017_MLTC_Layout_20_of_103_(32539539861).jpg"
  },
  "l14": {
    "src": "images/l14.jpg",
    "alt": "樂高迷自己設計的火車路線",
    "artist": "Michael Barera",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Trainfest_2022_106_(Pewaukee_Road_Lego_Train_Line).jpg"
  },
  "l15": {
    "src": "images/l15.jpg",
    "alt": "SPIKE 主機和馬達做的機器人",
    "artist": "Stilfehler",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Lego_Spike_Robot_2.jpg"
  },
  "l16": {
    "src": "images/l16.jpg",
    "alt": "會發光的樂高教育作品",
    "artist": "Klaus-Dieter Keller",
    "license": "CC0",
    "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    "page": "https://commons.wikimedia.org/wiki/File:Lego_WeDo_2.0_Glowing_Snail.jpg"
  },
  "l17": {
    "src": "images/l17.jpg",
    "alt": "樂高教育的馬達和感測器",
    "artist": "Klaus-Dieter Keller",
    "license": "CC0",
    "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    "page": "https://commons.wikimedia.org/wiki/File:Lego_WeDo_2.0_Motor_and_Sensors.jpg"
  },
  "l18": {
    "src": "images/l18.jpg",
    "alt": "樂高遊樂園作品",
    "artist": "Bill Ward from El Cerrito, CA, USA",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "page": "https://commons.wikimedia.org/wiki/File:Bricks_Cascade_2018_Amusement_Park_13_(40460410940).jpg"
  },
  "l19": {
    "src": "images/l19.jpg",
    "alt": "樂高夾取機構",
    "artist": "David Luders from Spokane, WA, USA",
    "license": "CC BY-SA 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
    "page": "https://commons.wikimedia.org/wiki/File:Simple_Lego_Grabber_Claw-Gripper.jpg"
  },
  "shop_moto": {
    "src": "images/shop_moto.jpg",
    "alt": "樂高 Technic 摩托車作品",
    "artist": "David Luders",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "page": "https://commons.wikimedia.org/wiki/File:Lego_Technic_MOC_%22Rage%22_Motorcycle_in_Silver.jpg"
  },
  "shop_battery": {
    "src": "images/shop_battery.jpg",
    "alt": "AAA 充電電池",
    "artist": "WaxPhilosophic",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "page": "https://commons.wikimedia.org/wiki/File:AAA_Rechargeable_Battery.jpg"
  },
  "shop_box": {
    "src": "images/shop_box.jpg",
    "alt": "多抽屜分類收納櫃",
    "artist": "Pascal from Heidelberg, Germany",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "page": "https://commons.wikimedia.org/wiki/File:Plastic_multi-drawer_storage_cabinets.jpg"
  },
  "l20": {
    "src": "images/l20.jpg",
    "alt": "樂高教育的機器人作品",
    "artist": "Klaus-Dieter Keller",
    "license": "CC0",
    "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    "page": "https://commons.wikimedia.org/wiki/File:Lego_WeDo_2.0_Spy_Robot.jpg"
  }
};
