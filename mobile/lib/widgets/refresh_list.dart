import 'package:flutter/cupertino.dart';
import '../theme.dart';

/// A scrolling page with iPhone-style pull to refresh: drag down from the
/// top, a spinner appears, and [onRefresh] reloads the data.
///
/// The spinner has to be the very first thing in the scroll view, or iOS
/// never shows it, so the gap under the status bar sits outside the list.
class RefreshList extends StatelessWidget {
  const RefreshList({super.key, required this.onRefresh, required this.children, this.padding = const EdgeInsets.symmetric(horizontal: S.page), this.top = 16});
  final Future<void> Function() onRefresh;
  final List<Widget> children;
  final EdgeInsets padding;

  /// Space above the content, under the status bar. Negative means none,
  /// for a page whose cover runs to the very top.
  final double top;

  @override
  Widget build(BuildContext context) {
    final pad = MediaQuery.of(context).padding;
    return Padding(
      padding: EdgeInsets.only(top: top < 0 ? 0 : pad.top),
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        slivers: [
          CupertinoSliverRefreshControl(onRefresh: onRefresh),
          SliverPadding(
            padding: padding.copyWith(top: top < 0 ? 0 : top, bottom: pad.bottom + 110),
            sliver: SliverList(delegate: SliverChildListDelegate(children)),
          ),
        ],
      ),
    );
  }
}
