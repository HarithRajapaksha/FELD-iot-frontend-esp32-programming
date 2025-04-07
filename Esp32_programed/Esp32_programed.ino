#include <Wire.h>
#include <MPU6050.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <time.h>
#include <math.h>

// ========== Wi-Fi ==========
#define WIFI_SSID "SLT-ADSL280D74"
#define WIFI_PASSWORD "harith12"

// ========== Firebase ==========
#define API_KEY "AIzaSyBO1KOCL7WDIlhWFXEy3NrhOgyKlxkwBPI"
#define DATABASE_URL "https://se-project-d5d5b-default-rtdb.firebaseio.com"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ========== MPU6050 ==========
MPU6050 mpu;

// ========== Step & Fall Tracking ==========
int steps = 0;
unsigned long lastStepTime = 0;
unsigned long lastFallTime = 0;
bool fallDetected = false;

// ========== Thresholds ==========
float fallImpactThreshold = 1.4;      // Lower threshold for easier triggering
float stillnessThreshold = 0.7;       // If avg magnitude < this, user is still
int stepCooldown = 300;               // milliseconds
int fallCooldown = 5000;              // milliseconds
float stepLow = 1.2;                  // step lower threshold
float stepHigh = 2.4;                 // step upper threshold

// ========== Firebase Token Callback ==========
void tokenStatusCallback(TokenInfo info) {
  Serial.printf("🔐 Firebase Token: %s\n", info.status == token_status_ready ? "Ready" : "Not Ready");
}

// ========== Date & Time Utilities ==========
String getDateString() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "unknown_date";
  char buf[11];
  strftime(buf, sizeof(buf), "%Y-%m-%d", &timeinfo);
  return String(buf);
}

String getTimeString() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "unknown_time";
  char buf[20];
  strftime(buf, sizeof(buf), "%H:%M:%S", &timeinfo);
  return String(buf);
}

// ========== Setup ==========
void setup() {
  delay(1000);
  Serial.begin(115200);
  Serial.println("🚀 Starting Fall Detection System...");

  // Connect to Wi-Fi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("🌐 Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ Wi-Fi Connected!");

  // Sync time for timestamping
  configTime(19800, 0, "pool.ntp.org");  // GMT+5:30 for Sri Lanka

  // Firebase config
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  config.token_status_callback = tokenStatusCallback;

  auth.user.email = "IT21192050@my.sliit.lk";
  auth.user.password = "200007901313";

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println("⌛ Initializing Firebase...");
  while (!Firebase.ready()) delay(100);
  Serial.println("✅ Firebase Ready!");

  // MPU6050 setup
  Wire.begin(21, 22);
  mpu.initialize();
  if (!mpu.testConnection()) {
    Serial.println("❌ MPU6050 connection failed!");
    while (1);
  }
  Serial.println("✅ MPU6050 connected!");
}

// ========== Main Loop ==========
void loop() {
  int16_t ax, ay, az;
  mpu.getAcceleration(&ax, &ay, &az);

  // Normalize magnitude
  float aTotal = sqrt(ax * ax + ay * ay + az * az) / 16384.0;
  Serial.print("📊 Acceleration: ");
  Serial.println(aTotal, 2);

  // Step Detection
  if (aTotal > stepLow && aTotal < stepHigh) {
    if (millis() - lastStepTime > stepCooldown) {
      steps++;
      lastStepTime = millis();
      Serial.printf("👟 Step Count: %d\n", steps);
    }
  }

  // Fall Detection
  if (aTotal > fallImpactThreshold ) {
    Serial.println("⚠️ High impact detected. Checking for stillness...");

    bool isStill = true;

    if (isStill) {
      fallDetected = true;
      lastFallTime = millis();

      // Log fall with timestamp
      String date = getDateString();
      String time = getTimeString();
      String path = "/logs/" + date + "/fall_events/" + time;

      Serial.println("✅ Fall confirmed! Logging to Firebase...");
      if (Firebase.RTDB.setString(&fbdo, path.c_str(), "Fall detected")) {
        Serial.println("📤 Fall event logged!");
      } else {
        Serial.print("❌ Firebase error: ");
        Serial.println(fbdo.errorReason());
      }
    } else {
      Serial.println("🚶 No fall — movement detected.");
    }
  }

  // Update step count in Firebase (every loop)
  String today = getDateString();
  String stepPath = "/logs/" + today + "/steps";
  Firebase.RTDB.setInt(&fbdo, stepPath.c_str(), steps);

  delay(500);  // Smooth loop
}
