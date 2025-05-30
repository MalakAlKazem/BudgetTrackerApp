import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { Link, useRouter } from 'expo-router';
import * as yup from 'yup';

const { height } = Dimensions.get('window');

type LoginFormData = {
  email: string;
  password: string;
};

const schema = yup.object().shape({
  email: yup.string().email().required('Email is required'),
  password: yup.string().min(6).required('Password is required'),
});

const LoginScreen = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  });

  const router = useRouter();

  const onSubmit = async (data: LoginFormData) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      console.log('Logged in:', userCredential.user);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Login failed:', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Login</Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Email"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!errors.email}
              style={styles.input}
            />
          )}
        />
        {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Password"
              mode="outlined"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              error={!!errors.password}
              style={styles.input}
            />
          )}
        />
        {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          style={styles.button}
        >
          Login
        </Button>

        <Text style={styles.linkText}>
          Don't have an account?{' '}
          <Link href="/register" style={styles.link}>
            Register here
          </Link>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingTop: height * 0.15,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#343A40',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#388984',
    borderRadius: 10,
    paddingVertical: 5,
  },
  error: {
    color: '#F44336',
    marginBottom: 10,
    fontSize: 12,
  },
  linkText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 14,
  },
  link: {
    color: '#388984',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
