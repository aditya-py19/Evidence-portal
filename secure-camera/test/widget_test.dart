import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:secure_camera/screens/login_screen.dart';

void main() {
  testWidgets('LoginScreen renders Secure Cam title and fields', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: LoginScreen(),
      ),
    );

    expect(find.text('SECURE CAM'), findsOneWidget);
    expect(find.text('Secure Digital Evidence Capture'), findsOneWidget);
    expect(find.text('Officer Authentication'), findsOneWidget);
    expect(find.byType(TextField), findsNWidgets(2));
  });
}
