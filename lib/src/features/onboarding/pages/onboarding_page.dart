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
      'title': 'Easy Booking',
      'description': 'Book professional home services with just a few taps. It has never been easier to get help.',
    },
    {
      'image': 'assets/images/onb1.png',
      'title': 'Secure & Reliable',
      'description': 'All our service providers are thoroughly vetted and verified to ensure your complete safety.',
    },
    {
      'image': 'assets/images/onb2.png',
      'title': 'Expert People',
      'description': 'We have the best in class individuals working just for you. They are well trained and capable of handling anything you need.',
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
          // The PageView takes up the remaining space
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
                    // Top Image Section
                    Expanded(
                      flex: 6,
                      child: SizedBox(
                        width: double.infinity,
                        child: Image.asset(
                          _pagesData[index]['image']!,
                          fit: BoxFit.cover,
                          alignment: Alignment.bottomCenter,
                        ),
                      ),
                    ),
                    
                    // Bottom Text Section
                    Expanded(
                      flex: 4,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 30.0, vertical: 20.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              _pagesData[index]['title']!,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w800,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 20),
                            Text(
                              _pagesData[index]['description']!,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontSize: 15,
                                height: 1.5,
                                color: AppColors.textSecondary,
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
          
          // Bottom Controls (Indicator + Button)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 30),
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
                      _currentIndex == _pagesData.length - 1 ? 'Get Started' : 'Next',
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
