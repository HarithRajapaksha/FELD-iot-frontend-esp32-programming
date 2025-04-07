import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Button, Vibration } from 'react-native';
import moment from 'moment';
import axios from 'axios';

const API_URL = 'https://harith-xts3l.ondigitalocean.app/getdata';

const HomePage = ({ navigation }) => {
  const [currentTime, setCurrentTime] = useState(moment().format('hh:mm:ss A'));
  const [currentDate, setCurrentDate] = useState(moment().format('YYYY-MM-DD'));
  const [stepCount, setStepCount] = useState(0);
  const [fallDetected, setFallDetected] = useState(false);
  const lastFallCount = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(moment().format('hh:mm:ss A'));
      setCurrentDate(moment().format('YYYY-MM-DD'));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(API_URL);
        const today = moment().format('YYYY-MM-DD');
        const todayData = response.data[today];

        if (todayData) {
          if (typeof todayData.steps === 'number') {
            setStepCount(todayData.steps);
          }

          const fallEvents = todayData.fall_events || {};
          const currentFallCount = Object.keys(fallEvents).length;

          if (currentFallCount > lastFallCount.current) {
            setFallDetected(true);

            // Vibrate for 10 seconds (pattern: [wait, vibrate, pause])
            const vibrationPattern = [0, 500, 500];
            Vibration.vibrate(vibrationPattern, true); // loop

            setTimeout(() => {
              Vibration.cancel(); // stop vibration
              setFallDetected(false);
            }, 10000);
          }

          lastFallCount.current = currentFallCount;
        }
      } catch (error) {
        console.error('❌ Failed to fetch data:', error);
        setStepCount(0);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [currentDate]);

  return (
    <View style={styles.container}>
      <Text style={styles.time}>{currentTime}</Text>
      <Text style={styles.date}>{currentDate}</Text>
      <Text style={styles.steps}>👣 Today's Steps: {stepCount}</Text>
      {fallDetected && <Text style={styles.alert}>⚠️ Fall Detected!</Text>}

      <View style={{ marginTop: 40 }}>
        <Button
          title="Go to Previous Data"
          onPress={() => navigation.navigate('PreviousData')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#f4f4f4',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  time: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 40,
  },
  date: {
    fontSize: 20,
    color: '#555',
    marginBottom: 30,
  },
  steps: {
    fontSize: 24,
    color: '#2c3e50',
  },
  alert: {
    fontSize: 22,
    color: 'red',
    marginTop: 20,
  },
});

export default HomePage;
