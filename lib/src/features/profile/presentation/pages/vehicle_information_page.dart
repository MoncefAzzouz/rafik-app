import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

class VehicleInformationPage extends StatefulWidget {
  const VehicleInformationPage({super.key});

  @override
  State<VehicleInformationPage> createState() => _VehicleInformationPageState();
}

class _VehicleInformationPageState extends State<VehicleInformationPage> {
  String selectedType = 'Van';

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Vehicle information')),
    body: ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 30),
      children: [
        Container(
          height: 190,
          decoration: BoxDecoration(
            gradient: AppColors.primaryGradient,
            borderRadius: BorderRadius.circular(25),
          ),
          child: const Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.airport_shuttle_rounded,
                color: Colors.white,
                size: 88,
              ),
              SizedBox(height: 8),
              Text(
                'Renault Kangoo',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                ),
              ),
              Text(
                '123456-116-19',
                style: TextStyle(
                  color: Colors.white70,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'Vehicle type',
          style: TextStyle(
            color: AppColors.ink,
            fontSize: 16,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            for (final type in ['Motorbike', 'Car', 'Van']) ...[
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: SizedBox(
                      width: double.infinity,
                      child: Text(type, textAlign: TextAlign.center),
                    ),
                    selected: selectedType == type,
                    onSelected: (_) => setState(() => selectedType = type),
                    selectedColor: AppColors.royalBlue.withAlpha(25),
                    labelStyle: TextStyle(
                      color: selectedType == type
                          ? AppColors.royalBlue
                          : AppColors.textSecondary,
                      fontWeight: FontWeight.w800,
                    ),
                    side: BorderSide(
                      color: selectedType == type
                          ? AppColors.royalBlue
                          : AppColors.line,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 22),
        _detail(
          Icons.directions_car_outlined,
          'Make and model',
          'Renault Kangoo',
        ),
        _detail(Icons.calendar_month_outlined, 'Year', '2019'),
        _detail(Icons.palette_outlined, 'Color', 'White'),
        _detail(
          Icons.confirmation_number_outlined,
          'Registration',
          '123456-116-19',
        ),
        _detail(Icons.inventory_2_outlined, 'Maximum load', '750 kg'),
        const SizedBox(height: 14),
        FilledButton(
          onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Vehicle information saved')),
          ),
          style: FilledButton.styleFrom(backgroundColor: AppColors.royalBlue),
          child: const Text('Save vehicle'),
        ),
      ],
    ),
  );

  Widget _detail(IconData icon, String label, String value) => Container(
    margin: const EdgeInsets.only(bottom: 10),
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(17),
    ),
    child: Row(
      children: [
        Icon(icon, color: AppColors.royalBlue),
        const SizedBox(width: 13),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            color: AppColors.ink,
            fontWeight: FontWeight.w900,
          ),
        ),
      ],
    ),
  );
}
