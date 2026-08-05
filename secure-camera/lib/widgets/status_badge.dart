import 'package:flutter/material.dart';

class StatusBadge extends StatelessWidget {
  final String label;
  final Color backgroundColor;
  final Color textColor;
  final IconData? icon;

  const StatusBadge({
    Key? key,
    required this.label,
    required this.backgroundColor,
    required this.textColor,
    this.icon,
  }) : super(key: key);

  factory StatusBadge.verified(String label) => StatusBadge(
        label: label,
        backgroundColor: const Color(0xFFD1FAE5),
        textColor: const Color(0xFF065F46),
        icon: Icons.check_circle_outline,
      );

  factory StatusBadge.warning(String label) => StatusBadge(
        label: label,
        backgroundColor: const Color(0xFFFEF3C7),
        textColor: const Color(0xFF92400E),
        icon: Icons.warning_amber_outlined,
      );

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: textColor),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }
}
