package com.cometchat.sample;

import org.junit.runner.RunWith;
import org.junit.runners.Suite;

/**
 * Test suite to run all unit tests.
 */
@RunWith(Suite.class)
@Suite.SuiteClasses({
    TestClasses.class,
    ExampleUnitTest.class
})
public class TestSuite {
    // This class is just a holder for the suite annotation
}
