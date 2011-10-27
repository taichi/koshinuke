/**
 * original auther is amachang.
 *  http://d.hatena.ne.jp/amachang/20090915/1252999677
 */
goog.provide('outliner.createOutline');

outliner.createOutline = function createOutline(document) {

    // Let current outlinee be null. (It holds the element whose outline is being created.)
    var outlinee = null;

    // Let current section be null. (It holds a pointer to a section, so that elements in the DOM can all be associated with a section.)
    var section = null;

    // Create a stack to hold elements, which is used to handle nesting. Initialize this stack to empty.
    var stack = [];

    var nextSectionId = 1;

    // As you walk over the DOM in tree order, trigger the first relevant step below for each element as you enter and exit it.
    (function (element) {
        var elementInfo = { element: element, outline: null };
        if (trigger(elementInfo, true)) {
            return true;
        }
        var child = element.firstChild;
        if (child) {
            do {
                if (child.nodeType == 1) {
                    if (arguments.callee(child)) {
                        return true;
                    }
                }
            } while (child = child.nextSibling);
        }
        if (trigger(elementInfo, false)) {
            return true;
        }
        return false;
    })(document.documentElement);

    function trigger(elementInfo, enter) {
        var exit = !enter;
        var goNext = false;

        // If the top of the stack is an element, and you are exiting that element
        if (exit && stack[stack.length - 1] == elementInfo) {
            // Pop that element from the stack.
            stack.pop();
        }

        // If the top of the stack is a heading content element
        else if (stack.length && isHeading(stack[stack.length - 1].element)) {

            // Do nothing.
        }

        // When entering a sectioning content element or a sectioning root element
        else if (enter && (isSectioningContent(elementInfo.element) || isSectioningRoot(elementInfo.element))) {

            // If current outlinee is not null, push current outlinee onto the stack.
            if (outlinee) {
                stack.push(outlinee);
            }

            // Let current outlinee be the element that is being entered.
            outlinee = elementInfo;

            // Let current section be a newly created section for the current outlinee element.
            section = { nested: [], element: elementInfo, id: nextSectionId++ };

            // Let there be a new outline for the new current outlinee,
            outlinee.outline = [];
            // initialized with just the new current section as the only section in the outline.
            outlinee.outline.push(section);
            outlinee.outline.lastSection = section;
        }

        // When exiting a sectioning content element, if the stack is not empty
        else if (exit && isSectioningContent(elementInfo.element) && stack.length) {

            // Pop the top element from the stack, and let the current outlinee be that element.
            outlinee = stack.pop();

            // Let current section be the last section in the outline of the current outlinee element.
            section = outlinee.outline.lastSection;

            // Append the outline of the sectioning content element being exited to the current section. 
            // (This does not change which section is the last section in the outline.)
            for (var i = 0; i < elementInfo.outline.length; i ++) {
                section.nested.push(elementInfo.outline[i]);
            }
        }

        // When exiting a sectioning root element, if the stack is not empty
        else if (exit && isSectioningRoot(elementInfo.element) && stack.length) {

            // Pop the top element from the stack, and let the current outlinee be that element.
            outlinee = stack.pop();

            // Let current section be the last section in the outline of the current outlinee element.
            section = outlinee.outline.lastSection;

            // Finding the deepest child: If current section has no child sections, stop these steps.
            while (section.nested.length) {

                // Let current section be the last child section of the current current section.
                section = section.nested[section.nested.length - 1];

                // Go back to the substep labeled finding the deepest child.
            }
        }

        // When exiting a sectioning content element or a sectioning root element
        else if (exit && (isSectioningContent(elementInfo.element) || isSectioningRoot(elementInfo.element))) {

            // Let current section be the first section in the outline of the current outlinee element.
            section = outlinee.outline[0];

            // Skip to the next step in the overall set of steps. (The walk is over.)
            goNext = true;
        }

        // If the current outlinee is null.
        else if (!outlinee) {

            // Do nothing.
        }

        // When entering a heading content element
        else if (enter && isHeading(elementInfo.element)) {

            // If the current section has no heading, 
            if (!section.head) {
                // let the element being entered be the heading for the current section.
                section.head = elementInfo;
            }

            // Otherwise, if the element being entered has a rank equal to or greater than 
            // the heading of the last section of the outline of the current outlinee, 
            else if (getRank(elementInfo.element) >= getRank(outlinee.outline.lastSection.head.element)) {
                // then create a new section 
                var newSection = { nested: [], element: elementInfo, id: nextSectionId++ };
                // and append it to the outline of the current outlinee element,
                // so that this new section is the new last section of that outline.
                outlinee.outline.push(newSection);
                outlinee.outline.lastSection = newSection;
                // Let current section be that new section.
                section = newSection;
                // Let the element being entered be the new heading for the current section.
                section.head = elementInfo;
            }

            // Otherwise, run these substeps:
            else {

                // Let candidate section be current section.
                var candidateSection = section;

                // (step 2)
                while (true) {

                    // If the element being entered has a rank lower than the rank of the heading of the candidate section,
                    if (getRank(elementInfo.element) < getRank(candidateSection.head.element)) {
                        // then create a new section,
                        var newSection = { nested: [], element: elementInfo, id: nextSectionId++ };
                        // and append it to candidate section.
                        // (This does not change which section is the last section in the outline.)
                        candidateSection.nested.push(newSection);
                        // Let current section be this new section.
                        section = newSection;
                        // Let the element being entered be the new heading for the current section. 
                        section.head = elementInfo;
                        // Abort these substeps.
                        break;
                    }

                    // Let new candidate section be the section that contains candidate section in the outline of current outlinee.
                    var newCandidateSection = (function (parent, list) {
                        for (var i = 0; i < list.length; i ++) {
                            var section = list[i];
                            if (section == candidateSection) {
                                return parent;
                            }
                            else {
                                var r = arguments.callee(section, section.nested);
                                if (r) {
                                    return r;
                                }
                            }
                        }
                        return null;
                    })(null, outlinee.outline);

                    // Let candidate section be new candidate section.
                    candidateSection = newCandidateSection;

                    // Return to step 2.
                }
            }

            // Push the element being entered onto the stack.
            // (This causes the algorithm to skip any descendants of the element.)
            stack.push(elementInfo);
        }
        else {

            // Do nothing.
        }

        // In addition, whenever you exit a node, after doing the steps above,
        // if current section is not null, 
        if (exit && section) {
            // associate the node with the section current section.
            // Note: not imlementation
        }

        return goNext;
    }

    // If the current outlinee is null, 
    // then there was no sectioning content element or sectioning root element in the DOM. There is no outline. Abort these steps.
    if (!outlinee) {
        return null;
    }

    // Associate any nodes that were not associated with a section in the steps above with current outlinee as their section.
    // Associate all nodes with the heading of the section with which they are associated, if any.
    // Note: not imlementation

    // If current outlinee is the body element, then the outline created for that element is the outline of the entire document.
    if (outlinee.element == document.body) {
        return (function (list) {
                var result = [];
                for (var i = 0; i < list.length; i ++) {
                var section = list[i];
                var obj = { childs: arguments.callee(section.nested) };
                obj.headElement = section.head ? section.head.element : null;
                obj.element = section.element ? section.element.element : null;
                result.push(obj);
            }
            return result;
        })(outlinee.outline);
    }

    return null;

    function getRank(element) {
        switch (element.tagName.toLowerCase()) {
            case 'h1': return 6;
            case 'h2': return 5;
            case 'h3': return 4;
            case 'h4': return 3;
            case 'h5': return 2;
            case 'h6': return 1;
            case 'hgroup':
                for (var i = 1; i <= 6; i ++) {
                    if (element.getElementsByTagName('h' + i).length) {
                        return 7 - i;
                    }
                }
                return 6;
        }
        return 0;
    }
    function isHeading(element) {
        return testElementName(element, /^(h[1-6]|hgroup)$/);
    }
    function isSectioningContent(element) {
        return testElementName(element, /^(article|aside|nav|section)$/);
    }
    function isSectioningRoot(element) {
        return testElementName(element, /^(blockquote|body|figure|td)$/);
    }
    function testElementName(element, regex) {
        return regex.test(element.tagName.toLowerCase())
    }
}
