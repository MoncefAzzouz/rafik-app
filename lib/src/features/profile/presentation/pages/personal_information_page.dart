import 'package:flutter/material.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../orders/data/truck_repository.dart';

class PersonalInformationPage extends StatefulWidget {
  const PersonalInformationPage({super.key});

  @override
  State<PersonalInformationPage> createState() =>
      _PersonalInformationPageState();
}

class _PersonalInformationPageState extends State<PersonalInformationPage> {
  late final nameController = TextEditingController(
    text: TruckRepository.instance.truck?.driverName ?? '',
  );
  late final phoneController = TextEditingController(
    text: TruckRepository.instance.truck?.phone ?? '',
  );

  bool _isSaving = false;

  @override
  void dispose() {
    nameController.dispose();
    phoneController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final truck = TruckRepository.instance.truck;
    if (truck == null) return;

    setState(() => _isSaving = true);

    final result = await ApiClient.instance.put(
      '/api/truck/trucks/${truck.id}',
      body: {
        'driverName': nameController.text.trim(),
        'phone': phoneController.text.trim(),
      },
    );

    if (!mounted) return;
    setState(() => _isSaving = false);

    result.fold(
      onSuccess: (_) async {
        await TruckRepository.instance.refreshTruckProfile();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Personal information saved')),
        );
      },
      onFailure: (failure) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(failure.message)));
      },
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty);
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first.substring(0, 1) + parts.last.substring(0, 1))
        .toUpperCase();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Personal information')),
    body: ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 30),
      children: [
        Center(
          child: Container(
            width: 92,
            height: 92,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: AppColors.primaryGradient,
            ),
            child: Text(
              _initials(TruckRepository.instance.truck?.driverName ?? ''),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 26,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ),
        const SizedBox(height: 34),
        _field('Full name', nameController, Icons.person_outline_rounded),
        _field(
          'Phone number',
          phoneController,
          Icons.phone_outlined,
          type: TextInputType.phone,
        ),
        const SizedBox(height: 8),
        FilledButton(
          onPressed: _isSaving ? null : _save,
          style: FilledButton.styleFrom(backgroundColor: AppColors.royalBlue),
          child: _isSaving
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.4,
                    color: Colors.white,
                  ),
                )
              : const Text('Save changes'),
        ),
      ],
    ),
  );

  Widget _field(
    String label,
    TextEditingController controller,
    IconData icon, {
    TextInputType? type,
  }) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: TextField(
      controller: controller,
      keyboardType: type,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: AppColors.royalBlue),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(17),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(17),
          borderSide: const BorderSide(color: AppColors.line),
        ),
      ),
    ),
  );
}
