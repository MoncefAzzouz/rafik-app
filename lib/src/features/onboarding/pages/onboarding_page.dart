import 'package:flutter/material.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import '../../../core/theme/app_colors.dart';
import '../../auth/pages/login_page.dart';

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  final PageController _controller = PageController();
  int _currentIndex = 0;

  final List<Map<String, String>> _pagesData = [
    {
      'image': 'assets/images/onb0.png',
      'title': 'Everything You Need',
      'description':
          'Food, taxi, shopping, deliveries, and home services, all organized in one clean app.',
    },
    {
      'image': 'assets/images/onb1.png',
      'title': 'Track With Confidence',
      'description':
          'Follow every ride and order in real time with trusted providers and clear updates.',
    },
    {
      'image': 'assets/images/onb2.png',
      'title': 'Tap. Confirm. Done.',
      'description':
          'Request what you need in seconds and let Rafik handle the rest, fast and smoothly.',
    },
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _nextPage() {
    if (_currentIndex == _pagesData.length - 1) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const LoginPage()),
      );
    } else {
      _controller.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundWhite,
      body: Column(
        children: [
          Expanded(
            child: PageView.builder(
              controller: _controller,
              onPageChanged: (index) {
                setState(() {
                  _currentIndex = index;
                });
              },
              itemCount: _pagesData.length,
              itemBuilder: (context, index) {
                return Column(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: const BorderRadius.only(
                          bottomLeft: Radius.circular(36),
                          bottomRight: Radius.circular(36),
                        ),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            Image.asset(
                              _pagesData[index]['image']!,
                              fit: BoxFit.cover,
                              alignment: Alignment.center,
                            ),
                            Positioned(
                              left: 0,
                              right: 0,
                              bottom: 0,
                              height: 80,
                              child: DecoratedBox(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    begin: Alignment.topCenter,
                                    end: Alignment.bottomCenter,
                                    colors: [
                                      Colors.transparent,
                                      AppColors.backgroundWhite.withAlpha(245),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(30, 16, 30, 12),
                      child: SizedBox(
                        width: double.infinity,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            SizedBox(
                              width: double.infinity,
                              child: Text(
                                _pagesData[index]['title']!,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 30,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.textPrimary,
                                  height: 1.08,
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            SizedBox(
                              width: double.infinity,
                              child: Text(
                                _pagesData[index]['description']!,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 15,
                                  height: 1.55,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
          Container(
            padding: const EdgeInsets.fromLTRB(30, 8, 30, 30),
            child: Column(
              children: [
                SmoothPageIndicator(
                  controller: _controller,
                  count: _pagesData.length,
                  effect: ExpandingDotsEffect(
                    activeDotColor: AppColors.primary,
                    dotColor: Colors.grey.shade300,
                    dotHeight: 8,
                    dotWidth: 8,
                    expansionFactor: 3,
                  ),
                ),
                const SizedBox(height: 30),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _nextPage,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: AppColors.backgroundWhite,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: Text(
                      _currentIndex == _pagesData.length - 1
                          ? 'Start with Rafik'
                          : 'Continue',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
