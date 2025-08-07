<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic unit test example.
     */
    public function test_that_true_is_true(): void
    {
        $this->assertTrue(true);
    }

    /**
     * Test basic math
     */
    public function test_basic_math(): void
    {
        $this->assertEquals(4, 2 + 2);
        $this->assertEquals(0, 2 - 2);
        $this->assertEquals(4, 2 * 2);
        $this->assertEquals(1, 2 / 2);
    }
}