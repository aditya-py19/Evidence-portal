import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/biometric_service.dart';
import 'case_selection_screen.dart';

enum AuthMode { password, otp }

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  final _otpController = TextEditingController();

  final _authService = AuthService();
  final _biometricService = BiometricService();

  AuthMode _authMode = AuthMode.password;
  bool _rememberMe = true; // Feature 2: Keep me signed in enabled by default
  bool _otpSent = false;
  bool _isLoading = false;
  bool _isBiometricSupported = false;
  String? _errorMessage;
  String? _infoMessage;

  @override
  void initState() {
    super.initState();
    _checkBiometricSupport();
  }

  Future<void> _checkBiometricSupport() async {
    final available = await _biometricService.isBiometricAvailable();
    if (mounted) {
      setState(() {
        _isBiometricSupported = available;
      });
    }
  }

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _handlePasswordLogin() async {
    final identifier = _identifierController.text.trim();
    final password = _passwordController.text;

    if (identifier.isEmpty || password.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter Force ID / Mobile Number and Password.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _infoMessage = null;
    });

    try {
      final user = await _authService.login(
        identifier,
        password,
        rememberMe: _rememberMe,
      );
      if (!mounted) return;

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => CaseSelectionScreen(user: user),
        ),
      );
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleRequestOtp() async {
    final mobile = _identifierController.text.trim();
    if (mobile.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter registered mobile number for OTP dispatch.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _infoMessage = null;
    });

    try {
      await _authService.requestOtp(mobile);
      if (mounted) {
        setState(() {
          _otpSent = true;
          _infoMessage = '✓ OTP verification code sent to $mobile';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleVerifyOtp() async {
    final mobile = _identifierController.text.trim();
    final otp = _otpController.text.trim();

    if (mobile.isEmpty || otp.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter both Mobile Number and 6-digit OTP code.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _infoMessage = null;
    });

    try {
      final user = await _authService.verifyOtp(
        mobile,
        otp,
        rememberMe: _rememberMe,
      );
      if (!mounted) return;

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => CaseSelectionScreen(user: user),
        ),
      );
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleBiometricAuth() async {
    final authenticated = await _biometricService.authenticateOfficer();
    if (authenticated) {
      final savedUser = await _authService.getSavedUser();
      if (savedUser != null && mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => CaseSelectionScreen(user: savedUser),
          ),
        );
        return;
      }
    }

    if (mounted) {
      setState(() {
        _errorMessage = 'Biometric authentication failed. Please enter credentials.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header Brand Emblem
                Center(
                  child: Container(
                    width: 80,
                    height: 80,
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.04),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Image.asset(
                      'assets/images/chhattisgarh-police-logo.png',
                      width: 64,
                      height: 64,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => const Icon(
                        Icons.shield_outlined,
                        size: 40,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                const Text(
                  'SECURE CAM',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2.0,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 4),

                const Text(
                  'Secure Digital Evidence Capture',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF2563EB),
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 24),

                // Login Form Card
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Officer Authentication',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Authorized law enforcement portal access',
                        style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                      ),
                      const SizedBox(height: 16),

                      // Feature 5: Login Option Selector (Password vs OTP)
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: GestureDetector(
                                onTap: () {
                                  setState(() {
                                    _authMode = AuthMode.password;
                                    _errorMessage = null;
                                    _infoMessage = null;
                                  });
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  decoration: BoxDecoration(
                                    color: _authMode == AuthMode.password
                                        ? Colors.white
                                        : Colors.transparent,
                                    borderRadius: BorderRadius.circular(8),
                                    boxShadow: _authMode == AuthMode.password
                                        ? [
                                            BoxShadow(
                                              color: Colors.black.withValues(alpha: 0.05),
                                              blurRadius: 4,
                                            ),
                                          ]
                                        : [],
                                  ),
                                  child: Text(
                                    'Password Login',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: _authMode == AuthMode.password
                                          ? const Color(0xFF0F172A)
                                          : const Color(0xFF64748B),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            Expanded(
                              child: GestureDetector(
                                onTap: () {
                                  setState(() {
                                    _authMode = AuthMode.otp;
                                    _errorMessage = null;
                                    _infoMessage = null;
                                  });
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  decoration: BoxDecoration(
                                    color: _authMode == AuthMode.otp
                                        ? Colors.white
                                        : Colors.transparent,
                                    borderRadius: BorderRadius.circular(8),
                                    boxShadow: _authMode == AuthMode.otp
                                        ? [
                                            BoxShadow(
                                              color: Colors.black.withValues(alpha: 0.05),
                                              blurRadius: 4,
                                            ),
                                          ]
                                        : [],
                                  ),
                                  child: Text(
                                    'Login with OTP',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: _authMode == AuthMode.otp
                                          ? const Color(0xFF0F172A)
                                          : const Color(0xFF64748B),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      if (_errorMessage != null) ...[
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF2F2),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFFCA5A5)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.error_outline,
                                  color: Color(0xFFDC2626), size: 18),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _errorMessage!,
                                  style: const TextStyle(
                                      fontSize: 12, color: Color(0xFF991B1B)),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      if (_infoMessage != null) ...[
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF0FDF4),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFF86EFAC)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle_outline,
                                  color: Color(0xFF16A34A), size: 18),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _infoMessage!,
                                  style: const TextStyle(
                                      fontSize: 12, color: Color(0xFF166534)),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Feature 4: Mobile Number / Force ID Flexible Identifier
                      TextField(
                        controller: _identifierController,
                        keyboardType: _authMode == AuthMode.otp
                            ? TextInputType.phone
                            : TextInputType.text,
                        decoration: InputDecoration(
                          labelText: _authMode == AuthMode.otp
                              ? 'Registered Mobile Number'
                              : 'Force ID / Mobile Number / Username',
                          prefixIcon: Icon(_authMode == AuthMode.otp
                              ? Icons.phone_android_outlined
                              : Icons.badge_outlined),
                          border: const OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 16),

                      if (_authMode == AuthMode.password) ...[
                        // Password Input
                        TextField(
                          controller: _passwordController,
                          obscureText: true,
                          decoration: const InputDecoration(
                            labelText: 'Password',
                            prefixIcon: Icon(Icons.lock_outline),
                            border: OutlineInputBorder(),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ] else ...[
                        if (_otpSent) ...[
                          TextField(
                            controller: _otpController,
                            keyboardType: TextInputType.number,
                            maxLength: 6,
                            decoration: const InputDecoration(
                              labelText: 'Enter 6-Digit OTP Code',
                              prefixIcon: Icon(Icons.pin_outlined),
                              border: OutlineInputBorder(),
                              counterText: '',
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],
                      ],

                      // Feature 2: Remember Me Checkbox
                      Row(
                        children: [
                          SizedBox(
                            width: 24,
                            height: 24,
                            child: Checkbox(
                              value: _rememberMe,
                              activeColor: const Color(0xFF0F172A),
                              onChanged: (val) {
                                setState(() {
                                  _rememberMe = val ?? true;
                                });
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Expanded(
                            child: Text(
                              'Keep me signed in',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF334155),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Feature 10: Authenticate Button
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton(
                          onPressed: _isLoading
                              ? null
                              : (_authMode == AuthMode.password
                                  ? _handlePasswordLogin
                                  : (_otpSent ? _handleVerifyOtp : _handleRequestOtp)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0F172A),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : Text(
                                  _authMode == AuthMode.password
                                      ? 'AUTHENTICATE OFFICER'
                                      : (_otpSent ? 'VERIFY OTP & LOGIN' : 'SEND OTP CODE'),
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.0,
                                  ),
                                ),
                        ),
                      ),

                      // Feature 3: Biometric Quick Login Shortcut
                      if (_isBiometricSupported) ...[
                        const SizedBox(height: 12),
                        OutlinedButton.icon(
                          onPressed: _handleBiometricAuth,
                          icon: const Icon(Icons.fingerprint, size: 20),
                          label: const Text('UNLOCK WITH BIOMETRICS / PIN'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFF0F172A),
                            minimumSize: const Size.fromHeight(44),
                            side: const BorderSide(color: Color(0xFFCBD5E1)),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                const Text(
                  'Authorized Law Enforcement Evidence Collection Application.\nSealed cryptographically to Evidence Portal ledger.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

