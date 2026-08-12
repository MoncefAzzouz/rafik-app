import 'package:flutter/material.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../home/presentation/pages/driver_shell.dart';
import '../data/auth_repository.dart';

class _TruckType {
  final String id;
  final String name;
  final String? capacityLabel;

  const _TruckType({required this.id, required this.name, this.capacityLabel});

  factory _TruckType.fromJson(Map<String, dynamic> json) => _TruckType(
    id: json['id'].toString(),
    name: json['name'] as String? ?? 'Truck',
    capacityLabel: json['capacityLabel'] as String?,
  );
}

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _plateController = TextEditingController();

  bool _obscurePassword = true;
  bool _isSubmitting = false;
  String? _errorText;

  bool _loadingTruckTypes = true;
  String? _truckTypesError;
  List<_TruckType> _truckTypes = [];
  String? _selectedTruckTypeId;

  @override
  void initState() {
    super.initState();
    _loadTruckTypes();
  }

  Future<void> _loadTruckTypes() async {
    final result = await ApiClient.instance.get('/api/truck/types');
    if (!mounted) return;
    result.fold(
      onSuccess: (value) {
        final list = (value as List)
            .cast<Map<String, dynamic>>()
            .map(_TruckType.fromJson)
            .toList();
        setState(() {
          _truckTypes = list;
          _loadingTruckTypes = false;
          if (list.isNotEmpty) _selectedTruckTypeId = list.first.id;
        });
      },
      onFailure: (failure) {
        setState(() {
          _loadingTruckTypes = false;
          _truckTypesError = failure.message;
        });
      },
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _plateController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    if (_selectedTruckTypeId == null) {
      setState(() => _errorText = 'Select your truck type');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorText = null;
    });

    final result = await AuthRepository.instance.register(
      driverName: _nameController.text.trim(),
      phone: _phoneController.text.trim(),
      email: _emailController.text.trim(),
      password: _passwordController.text,
      truckTypeId: _selectedTruckTypeId!,
      plate: _plateController.text.trim().isEmpty
          ? null
          : _plateController.text.trim(),
    );

    if (!mounted) return;

    result.fold(
      onSuccess: (_) async {
        await showDialog<void>(
          context: context,
          builder: (dialogContext) => AlertDialog(
            title: const Text('Registration complete'),
            content: const Text(
              'Your truck has been registered. An admin will verify your '
              'truck before you start receiving orders.',
            ),
            actions: [
              FilledButton(
                onPressed: () => Navigator.pop(dialogContext),
                child: const Text('Got it'),
              ),
            ],
          ),
        );
        if (!mounted) return;
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const DriverShell()),
          (route) => false,
        );
      },
      onFailure: (failure) {
        setState(() {
          _isSubmitting = false;
          _errorText = failure.message;
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.backgroundLight,
    appBar: AppBar(
      backgroundColor: AppColors.backgroundLight,
      elevation: 0,
      title: const Text('Register as a driver'),
    ),
    body: SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Create your driver account',
                style: TextStyle(
                  color: AppColors.ink,
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Register your truck to start receiving delivery requests',
                style: TextStyle(color: AppColors.muted),
              ),
              const SizedBox(height: 24),
              if (_errorText != null) ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.red.withAlpha(20),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.error_outline_rounded,
                        color: AppColors.red,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _errorText!,
                          style: const TextStyle(color: AppColors.red),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
              ],
              TextFormField(
                controller: _nameController,
                textInputAction: TextInputAction.next,
                decoration: _inputDecoration(
                  'Driver full name',
                  Icons.person_outline_rounded,
                ),
                validator: (value) => (value == null || value.trim().isEmpty)
                    ? 'Enter your full name'
                    : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                textInputAction: TextInputAction.next,
                decoration: _inputDecoration(
                  'Phone number',
                  Icons.phone_outlined,
                ),
                validator: (value) => (value == null || value.trim().isEmpty)
                    ? 'Enter your phone number'
                    : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                decoration: _inputDecoration('Email', Icons.email_outlined),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Email is required so you can log back in';
                  }
                  if (!value.contains('@')) return 'Enter a valid email';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                textInputAction: TextInputAction.next,
                decoration:
                    _inputDecoration('Password', Icons.lock_outline_rounded)
                        .copyWith(
                          suffixIcon: IconButton(
                            onPressed: () => setState(
                              () => _obscurePassword = !_obscurePassword,
                            ),
                            icon: Icon(
                              _obscurePassword
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                              color: AppColors.muted,
                            ),
                          ),
                        ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Enter a password';
                  }
                  if (value.length < 6) {
                    return 'Password must be at least 6 characters';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _plateController,
                textInputAction: TextInputAction.done,
                decoration: _inputDecoration(
                  'Plate number (optional)',
                  Icons.confirmation_number_outlined,
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Truck type',
                style: TextStyle(
                  color: AppColors.ink,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 10),
              _buildTruckTypePicker(),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _isSubmitting ? null : _submit,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.royalBlue,
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.4,
                          color: Colors.white,
                        ),
                      )
                    : const Text('Create account'),
              ),
            ],
          ),
        ),
      ),
    ),
  );

  Widget _buildTruckTypePicker() {
    if (_loadingTruckTypes) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 14),
        child: Center(child: CircularProgressIndicator(strokeWidth: 2.4)),
      );
    }
    if (_truckTypesError != null) {
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.red.withAlpha(15),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                'Could not load truck types: $_truckTypesError',
                style: const TextStyle(color: AppColors.red),
              ),
            ),
            TextButton(
              onPressed: () {
                setState(() {
                  _loadingTruckTypes = true;
                  _truckTypesError = null;
                });
                _loadTruckTypes();
              },
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }
    if (_truckTypes.isEmpty) {
      return const Text(
        'No truck types available right now.',
        style: TextStyle(color: AppColors.muted),
      );
    }
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        for (final type in _truckTypes)
          ChoiceChip(
            label: Text(
              type.capacityLabel != null
                  ? '${type.name} · ${type.capacityLabel}'
                  : type.name,
            ),
            selected: _selectedTruckTypeId == type.id,
            onSelected: (_) => setState(() => _selectedTruckTypeId = type.id),
            selectedColor: AppColors.royalBlue.withAlpha(25),
            labelStyle: TextStyle(
              color: _selectedTruckTypeId == type.id
                  ? AppColors.royalBlue
                  : AppColors.textSecondary,
              fontWeight: FontWeight.w800,
            ),
            side: BorderSide(
              color: _selectedTruckTypeId == type.id
                  ? AppColors.royalBlue
                  : AppColors.line,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
      ],
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) =>
      InputDecoration(
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
      );
}
