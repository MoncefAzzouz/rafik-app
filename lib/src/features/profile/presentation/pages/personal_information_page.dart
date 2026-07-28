import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

class PersonalInformationPage extends StatefulWidget {
  const PersonalInformationPage({super.key});

  @override
  State<PersonalInformationPage> createState() =>
      _PersonalInformationPageState();
}

class _PersonalInformationPageState extends State<PersonalInformationPage> {
  final nameController = TextEditingController(text: 'Moncef Azzouz');
  final phoneController = TextEditingController(text: '+213 550 123 456');
  final emailController = TextEditingController(text: 'moncef@email.com');
  final addressController = TextEditingController(
    text: 'Cité El Hidhab, Sétif',
  );

  @override
  void dispose() {
    nameController.dispose();
    phoneController.dispose();
    emailController.dispose();
    addressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Personal information')),
    body: ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 30),
      children: [
        Center(
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 92,
                height: 92,
                alignment: Alignment.center,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: AppColors.primaryGradient,
                ),
                child: const Text(
                  'MA',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 26,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              Positioned(
                right: -2,
                bottom: -2,
                child: Material(
                  color: AppColors.royalBlue,
                  shape: const CircleBorder(),
                  child: IconButton(
                    onPressed: () {},
                    icon: const Icon(
                      Icons.camera_alt_rounded,
                      color: Colors.white,
                      size: 18,
                    ),
                  ),
                ),
              ),
            ],
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
        _field(
          'Email address',
          emailController,
          Icons.email_outlined,
          type: TextInputType.emailAddress,
        ),
        _field('Home address', addressController, Icons.home_outlined),
        const SizedBox(height: 8),
        FilledButton(
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Personal information saved')),
            );
          },
          style: FilledButton.styleFrom(backgroundColor: AppColors.royalBlue),
          child: const Text('Save changes'),
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
