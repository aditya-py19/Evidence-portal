import 'package:flutter/material.dart';
import 'models/user_model.dart';
import 'screens/case_selection_screen.dart';
import 'screens/login_screen.dart';
import 'services/auth_service.dart';
import 'services/biometric_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const SecureCamApp());
}

class SecureCamApp extends StatelessWidget {
  const SecureCamApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Secure Cam',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        primaryColor: const Color(0xFF0F172A),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0F172A),
          primary: const Color(0xFF0F172A),
          secondary: const Color(0xFF2563EB),
          surface: Colors.white,
        ),
        fontFamily: 'Roboto',
        useMaterial3: true,
      ),
      home: const AuthWrapper(),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({Key? key}) : super(key: key);

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  final AuthService _authService = AuthService();
  final BiometricService _biometricService = BiometricService();

  bool _isLoading = true;
  UserModel? _savedUser;
  bool _biometricRequired = false;

  @override
  void initState() {
    super.initState();
    _checkSavedSession();
  }

  /// Feature 7: Auto-Login & Biometric Re-Authentication sequence
  Future<void> _checkSavedSession() async {
    try {
      final isSessionValid = await _authService.isSessionValid();
      if (!isSessionValid) {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
        }
        return;
      }

      final user = await _authService.getSavedUser();
      if (user != null && user.isOfficer) {
        // Feature 3: Check if biometric re-authentication is available
        final canBiometric = await _biometricService.isBiometricAvailable();
        if (canBiometric) {
          final authenticated = await _biometricService.authenticateOfficer(
            reason: 'Verify identity to resume Secure Cam session',
          );

          if (authenticated) {
            if (mounted) {
              setState(() {
                _savedUser = user;
                _isLoading = false;
              });
            }
            return;
          } else {
            // Biometric failed or canceled -> fallback to Login Screen with manual biometric option
            if (mounted) {
              setState(() {
                _biometricRequired = true;
                _isLoading = false;
              });
            }
            return;
          }
        }

        // Biometrics unavailable on hardware -> Auto login cleanly if persistent session valid
        if (mounted) {
          setState(() {
            _savedUser = user;
            _isLoading = false;
          });
        }
        return;
      }

      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset(
                'assets/images/chhattisgarh-police-logo.png',
                width: 72,
                height: 72,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) => const Icon(
                  Icons.shield_outlined,
                  size: 48,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 20),
              const CircularProgressIndicator(color: Color(0xFF0F172A)),
              const SizedBox(height: 12),
              const Text(
                'VERIFYING SECURE SESSION...',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.0,
                  color: Color(0xFF64748B),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_savedUser != null && _savedUser!.isOfficer && !_biometricRequired) {
      return CaseSelectionScreen(user: _savedUser!);
    }

    return const LoginScreen();
  }
}
