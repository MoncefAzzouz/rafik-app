import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../../../core/theme/app_colors.dart';
import 'home_page.dart';

class MainPage extends StatefulWidget {
  const MainPage({super.key});

  @override
  State<MainPage> createState() => _MainPageState();
}

class _MainPageState extends State<MainPage> {
  int _currentIndex = 0;

  final List<Widget> _pages = [
    const HomePage(),
    const Center(child: Text('Demandes', style: TextStyle(color: AppColors.textPrimary))),
    const Center(child: Text('Messages', style: TextStyle(color: AppColors.textPrimary))),
    const Center(child: Text('Profil', style: TextStyle(color: AppColors.textPrimary))),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: SafeArea(
        child: _pages[_currentIndex],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(12), // Very subtle shadow
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
          items: const [
            BottomNavigationBarItem(
              icon: Icon(FontAwesomeIcons.house),
              label: 'Accueil',
            ),
            BottomNavigationBarItem(
              icon: Icon(FontAwesomeIcons.briefcase),
              label: 'Demandes',
            ),
            BottomNavigationBarItem(
              icon: Icon(FontAwesomeIcons.message),
              label: 'Messages',
            ),
            BottomNavigationBarItem(
              icon: Icon(FontAwesomeIcons.user),
              label: 'Profil',
            ),
          ],
        ),
      ),
    );
  }
}
